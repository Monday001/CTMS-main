import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises"; // ⬅️ Use promises API for async operations
import fsSync from "fs"; // ⬅️ Use sync version only for stat/exists checks if necessary
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth"; // ✅ Token verification

// ⚠️ IMPORTANT: Increase the body size limit for file uploads.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

/**
 * Upload or replace timetable (ADMIN only)
 */
export async function POST(req: NextRequest) {
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  const currentUser = user as any;
  if (currentUser.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let absolutePath: string | null = null; // Track path for cleanup on failure

  try {
    console.log("⏳ Timetable upload started...");

    // 1. USE req.formData() TO PARSE MULTIPART DATA
    const formData = await req.formData();
    
    // ---------------------------------
    // ✅ CRITICAL FIX: The key "filepond" is sent multiple times. 
    // Use getAll() to retrieve all items and explicitly find the one that is the actual File/Blob object.
    const filePondItems = formData.getAll("filepond");
    
    // Find the actual File/Blob object among the items (A File object extends Blob)
    const file = filePondItems.find(item => item instanceof Blob) as File | null;
    // ---------------------------------

    if (!file) {
        const formKeys = Array.from(formData.keys());
        // ⬅️ Updated error message to reflect the expected 'filepond' key
        return NextResponse.json({ 
          error: `File upload failed. Expected form field 'filepond' (Blob/File type) is missing among received keys: [${formKeys.join(', ')}]` 
        }, { status: 400 });
    }

    // 2. Extract original file name and content
    const originalFileName = file.name || `timetable-${uuidv4()}.xlsx`;
    const arrayBuffer = await file.arrayBuffer(); // ⬅️ This should now correctly call arrayBuffer() on the File object
    const buffer = Buffer.from(arrayBuffer);

    // Check if replacement
    const replaceId = req.nextUrl.searchParams.get("replace_id") || null;

    // Save file to /public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Use async mkdir
    if (!fsSync.existsSync(uploadDir)) await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(originalFileName) || ".xlsx";
    const fileName = `${uuidv4()}${ext}`;
    absolutePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/${fileName}`;

    // 3. ASYNCHRONOUS FILE WRITE (Pure file content only)
    await fs.writeFile(absolutePath, buffer);

    const fileStats = await fs.stat(absolutePath); // Use async stat
    const fileDetails = {
      name: originalFileName,
      size: fileStats.size,
      type: ext.replace(".", "") || "xlsx",
      uploadedAt: new Date().toISOString(),
      filePath: publicPath,
    };

    // Replace or archive existing timetables
    if (replaceId) {
      await pool.query("UPDATE timetable SET status = 'archived' WHERE id = ?", [replaceId]);
    } else {
      await pool.query("UPDATE timetable SET status = 'archived' WHERE status = 'current'");
    }

    // Insert new timetable
    const [result]: any = await pool.query(
      `INSERT INTO timetable (name, size, type, filePath, status, createdAt)
       VALUES (?, ?, ?, ?, 'current', NOW())`,
      [fileDetails.name, fileDetails.size, fileDetails.type, fileDetails.filePath]
    );

    console.log("✅ Timetable uploaded by", currentUser.email);

    return NextResponse.json({
      message: "Timetable uploaded successfully",
      success: true,
      id: result.insertId,
      fileDetails,
    });
  } catch (error: any) {
    console.error("❌ Upload failed:", error.message);
    // Cleanup unsaved file if the database transaction fails
    if (absolutePath && fsSync.existsSync(absolutePath)) {
        try {
            await fs.unlink(absolutePath);
            console.log(`🧹 Cleaned up unsaved file: ${absolutePath}`);
        } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
        }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Get timetables (current or all)
 */
export async function GET(req: NextRequest) {
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  try {
    const type = req.nextUrl.searchParams.get("type");

    if (type === "current") {
      const [rows]: any = await pool.query(
        "SELECT * FROM timetable WHERE status = 'current' ORDER BY createdAt DESC LIMIT 1"
      );
      return NextResponse.json(rows[0] || {});
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM timetable ORDER BY createdAt DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ Fetch failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Archive or update timetable (ADMIN only)
 */
export async function PUT(req: NextRequest) {
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  const currentUser = user as any;
  if (currentUser.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    const action = req.nextUrl.searchParams.get("action");

    if (!id) return NextResponse.json({ error: "Missing timetable ID" }, { status: 400 });

    if (action === "archive") {
      await pool.query("UPDATE timetable SET status = 'archived' WHERE id = ?", [id]);
      console.log(`📦 Timetable ID ${id} archived by ${currentUser.email}`);
      return NextResponse.json({ success: true, message: "Archived successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Update failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Delete timetable (ADMIN only)
 */
export async function DELETE(req: NextRequest) {
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  const currentUser = user as any;
  if (currentUser.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing timetable ID" }, { status: 400 });

    const [rows]: any = await pool.query("SELECT filePath FROM timetable WHERE id = ?", [id]);
    if (rows.length === 0)
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });

    const filePath = path.join(process.cwd(), "public", rows[0].filePath);
    await pool.query("DELETE FROM timetable WHERE id = ?", [id]);

    if (fsSync.existsSync(filePath)) await fs.unlink(filePath); // Use async fs.unlink

    console.log(`🗑️ Timetable ${id} deleted by ${currentUser.email}`);
    return NextResponse.json({ success: true, message: "Timetable deleted successfully" });
  } catch (error: any) {
    console.error("❌ Delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
