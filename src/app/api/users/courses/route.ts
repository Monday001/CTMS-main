import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

// ✅ Handle GET (fetch all courses and departments)
export async function GET() {
  try {
    const [courses]: any = await pool.query(
      "SELECT * FROM courses ORDER BY department, course_name"
    );

    // ✅ Extract unique departments
    const departments = [...new Set(courses.map((c: any) => c.department))];

    return NextResponse.json({ success: true, courses, departments });
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// ✅ Handle POST (add new course, prevent duplicates)
export async function POST(req: NextRequest) {
  try {
    const { department, courseName, courseCode } = await req.json();

    if (!department || !courseName || !courseCode) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Check if course already exists in this department
    const [existing]: any = await pool.query(
      "SELECT * FROM courses WHERE department = ? AND course_name = ?",
      [department, courseName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Course "${courseName}" already exists under ${department} department.`,
        },
        { status: 400 }
      );
    }

    // ✅ Insert new course
    const [rows]: any = await pool.query(
      "INSERT INTO courses (department, course_name, course_code) VALUES (?, ?, ?)",
      [department, courseName, courseCode]
    );

    return NextResponse.json({
      success: true,
      message: "Course added successfully",
      id: rows.insertId,
    });
  } catch (error) {
    console.error("❌ Error adding course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add course" },
      { status: 500 }
    );
  }
}
