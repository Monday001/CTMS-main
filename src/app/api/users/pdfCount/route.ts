import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) AS pdfCount FROM timetable"
    );

    return NextResponse.json({ pdfCount: rows[0].pdfCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
