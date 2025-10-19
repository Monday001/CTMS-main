import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

/**
 * 📊 Course Distribution by Year API
 * Returns number of students per course per academic year
 * Accessible by ADMIN or LECTURER
 */
export async function GET(req: NextRequest) {
  // ✅ Token verification (same pattern as your other APIs)
  const { valid, user, response } = verifyToken(req);
  if (!valid) return response;

  const currentUser = user as any;

  // ✅ Role-based access
  if (currentUser.role !== "ADMIN" && currentUser.role !== "LECTURER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // ✅ Query course distribution by year
    const [rows]: any = await pool.query(`
      SELECT 
        s.course AS courseName, 
        s.yearOfStudy AS year,
        COUNT(u.id) AS studentCount
      FROM student s
      INNER JOIN users u ON u.id = s.id
      GROUP BY s.course, s.yearOfStudy
      ORDER BY s.course, s.yearOfStudy;
    `);

    // ✅ Transform data for your frontend GitHub-style graph
    const formatted = rows.map((r: any) => ({
      course: r.courseName,
      year: r.year,
      count: r.studentCount,
    }));

    return NextResponse.json({
      success: true,
      message: "Course distribution data fetched successfully",
      data: formatted,
    });
  } catch (error: any) {
    console.error("❌ Error fetching course distribution:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
