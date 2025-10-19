import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  try {
    const [rows]: any = await pool.query(
      "SELECT id, name, filePath, createdAt FROM timetable WHERE status = 'current' ORDER BY createdAt DESC LIMIT 1"
    );

    if (rows.length === 0)
      return NextResponse.json({ message: "No current timetable available" }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("❌ Failed to fetch current timetable:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
