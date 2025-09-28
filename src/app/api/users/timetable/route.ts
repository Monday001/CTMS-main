import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import pool from "@/dbConfig/dbConfig";

/**
 * Upload timetable PDF (store metadata in MySQL)
 */
export async function POST(req: NextRequest) {
  try {
    const formData: FormData = await req.formData();
    const uploadedFiles = formData.getAll("filepond");
    let fileName = "";

    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadedFile: File = uploadedFiles[0] as File;

      fileName = uuidv4();

      const pdfDetails = {
        size: uploadedFile.size,
        type: uploadedFile.type,
        name: uploadedFile.name,
        lastModified: uploadedFile.lastModified?.toString() || new Date().toISOString(),
      };

      // Save details into MySQL
      const [result]: any = await pool.query(
        `INSERT INTO timetable (name, size, type, lastModified) VALUES (?, ?, ?, ?)`,
        [pdfDetails.name, pdfDetails.size, pdfDetails.type, pdfDetails.lastModified]
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
    const [rows]: any = await pool.query("SELECT * FROM timetable ORDER BY createdAt DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Delete timetable by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No id provided for deletion" }, { status: 400 });
    }

    const [result]: any = await pool.query("DELETE FROM timetable WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Timetable deleted successfully",
      deletedId: id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
