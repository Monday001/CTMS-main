import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) AS studentCount FROM student"
    );

    return NextResponse.json({ studentCount: rows[0].studentCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
