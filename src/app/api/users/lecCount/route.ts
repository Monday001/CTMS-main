import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) AS lecturerCount FROM lecturer"
    );

    return NextResponse.json({ lecturerCount: rows[0].lecturerCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
