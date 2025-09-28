import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

// Handle GET /api/users/check-admin
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
    );

    return NextResponse.json({ exists: rows.length > 0 });
  } catch (err: any) {
    console.error("🔥 Error checking admin:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
