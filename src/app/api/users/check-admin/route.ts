import { NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth"; 

//Checks if an admin user exists in the system.
export async function GET(request: Request) {
  try {
    // 1️⃣ Verify the token using shared logic
    const currentUser = verifyToken();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized or session expired" },
        { status: 401 }
      );
    }

    // 2️⃣ Check if an admin exists
    const [rows]: any = await pool.query(
      "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
    );

    // 3️⃣ Return the result
    return NextResponse.json({ exists: rows.length > 0 });
  } catch (err: any) {
    console.error("🔥 Error checking admin:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
