import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";

// 🔹 Get one student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, 
              s.course, s.yearOfStudy, s.registrationNumber
       FROM users u
       JOIN student s ON u.id = s.id
       WHERE u.role = 'STUDENT' AND u.id = ?`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { firstname, lastname, email, course, yearOfStudy, registrationNumber } = body;

    if (!firstname || !lastname || !email || !course || !yearOfStudy || !registrationNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `UPDATE users u
       JOIN student s ON u.id = s.id
       SET u.firstname = ?, u.lastname = ?, u.email = ?,
           s.course = ?, s.yearOfStudy = ?, s.registrationNumber = ?
       WHERE u.id = ?`,
      [firstname, lastname, email, course, yearOfStudy, registrationNumber, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ✅ Return the updated student object
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, 
              s.course, s.yearOfStudy, s.registrationNumber
       FROM users u
       JOIN student s ON u.id = s.id
       WHERE u.id = ?`,
      [params.id]
    );

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // check exists
    const [student]: any = await pool.query("SELECT id FROM student WHERE id = ?", [params.id]);
    if (student.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // delete both
    await pool.query("DELETE FROM student WHERE id = ?", [params.id]);
    await pool.query("DELETE FROM users WHERE id = ?", [params.id]);

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
