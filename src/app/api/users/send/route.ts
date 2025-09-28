import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM timetable ORDER BY created_at DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "No PDF found" }, { status: 404 });
    }

    const timetable = rows[0];
    const filePath = path.join(process.cwd(), "uploads/timetables", timetable.file_path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${timetable.file_path}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
