// File: src/app/api/users/lecturer/get-notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const lecturer = user as any;
    if (lecturer.role !== "LECTURER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const url = new URL(req.url);
    const unitCode = url.searchParams.get("unitCode");

    let query = `
      SELECT id, title, unit_code, file_path, created_at, visible_to_students 
      FROM unit_notes WHERE lecturer_id = ?`;
    const params: any[] = [lecturer.registration_number];

    if (unitCode) {
      query += " AND unit_code = ?";
      params.push(unitCode);
    }

    query += " ORDER BY created_at DESC";

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, notes: rows });
  } catch (err: any) {
    console.error("GET notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
