import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT l.id, l.employeeNumber, u.username, u.email
       FROM lecturer l
       JOIN user u ON l.userId = u.id`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
