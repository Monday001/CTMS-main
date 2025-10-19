import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth"; // ✅ Token verification

export async function GET(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;

    // Fetch base user info
    const [users]: any = await pool.query(
      `SELECT id, firstname, lastname, email, role FROM users WHERE id = ? LIMIT 1`,
      [currentUser.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userInfo = users[0];
    let extraData: any = {};

    // Attach role-specific details
    if (userInfo.role === "STUDENT") {
      const [students]: any = await pool.query(
        `SELECT registrationNumber, course, yearOfStudy FROM student WHERE id = ? LIMIT 1`,
        [userInfo.id]
      );
      if (students.length > 0) extraData = students[0];
    } else if (userInfo.role === "LECTURER") {
      const [lecturers]: any = await pool.query(
        `SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1`,
        [userInfo.id]
      );
      if (lecturers.length > 0) extraData = lecturers[0];
    }

    return NextResponse.json({
      message: "User profile retrieved successfully",
      data: { ...userInfo, ...extraData },
    });
  } catch (error: any) {
    console.error("❌ /api/users/me error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
