import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT COUNT(*) AS noteCount FROM notification"
    );

    return NextResponse.json({ noteCount: rows[0].noteCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
