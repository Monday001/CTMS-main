import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const normalize = (str?: string | number | null): string =>
  str?.toString().trim().replace(/\s+/g, " ").toUpperCase() || "";

// GET: fetch notes for a student by unit code
export async function GET(req: NextRequest) {
  try {
    // ✅ Verify token
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const student = user as any;
    if (student.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ✅ Get unitCode from query
    const url = new URL(req.url);
    const unitCodeRaw = url.searchParams.get("unitCode");
    if (!unitCodeRaw)
      return NextResponse.json({ error: "Missing unit code" }, { status: 400 });

    const unitCode = normalize(unitCodeRaw);

    // ✅ Fetch notes visible to students
    const [notes]: any = await pool.query(
      `SELECT id, title, unit_code AS unitCode, file_path AS filePath, 
              created_at AS uploadedAt
       FROM unit_notes 
       WHERE unit_code = ? AND visible_to_students = 1
       ORDER BY created_at DESC`,
      [unitCode]
    );

    return NextResponse.json({ success: true, notes });
  } catch (err: any) {
    console.error("❌ GET student notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
