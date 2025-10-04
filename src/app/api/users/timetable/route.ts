import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import pool from "@/dbConfig/dbConfig";

/**
 * Upload timetable PDF (store file & metadata in MySQL)
 */
export async function POST(req: NextRequest) {
  try {
    const formData: FormData = await req.formData();
    const uploadedFiles = formData.getAll("filepond");
    let fileName = "";

    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile: File = uploadedFiles[0] as File;

      // Generate unique filename
      fileName = uuidv4();

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      // Save file to disk
      const buffer = Buffer.from(await uploadedFile.arrayBuffer());
      const filePath = path.join(uploadDir, `${fileName}.pdf`);
      fs.writeFileSync(filePath, buffer);

      // Save details into MySQL
      const pdfDetails = {
        size: uploadedFile.size,
        type: uploadedFile.type,
        name: uploadedFile.name,
        lastModified:
          uploadedFile.lastModified?.toString() || new Date().toISOString(),
        filePath,
      };

      const [result]: any = await pool.query(
        `INSERT INTO timetable (name, size, type, lastModified, filePath) VALUES (?, ?, ?, ?, ?)`,
        [
          pdfDetails.name,
          pdfDetails.size,
          pdfDetails.type,
          pdfDetails.lastModified,
          pdfDetails.filePath,
        ]
      );

      return NextResponse.json({
        message: "Timetable uploaded successfully",
        success: true,
        id: result.insertId,
        pdfDetails,
      });
    } else {
      return NextResponse.json(
        { error: "No files found or invalid format" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Get all timetables
 */
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM timetable ORDER BY createdAt DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Delete timetable by ID (also removes file from uploads folder)
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "No id provided for deletion" },
        { status: 400 }
      );
    }

    // Find file path first
    const [rows]: any = await pool.query(
      "SELECT filePath FROM timetable WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Timetable not found" },
        { status: 404 }
      );
    }

    const filePath = rows[0].filePath;

    // Delete from DB
    const [result]: any = await pool.query(
      "DELETE FROM timetable WHERE id = ?",
      [id]
    );

    if (result.affectedRows > 0 && filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // remove file from disk
    }

    return NextResponse.json({
      message: "Timetable deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
