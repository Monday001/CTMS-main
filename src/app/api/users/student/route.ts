import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import bcrypt from "bcryptjs";

// 🔹 Get all students
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, 
              s.course, s.yearOfStudy, s.registrationNumber
       FROM users u
       JOIN student s ON u.id = s.id
       WHERE u.role = 'STUDENT'`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Create student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstname,
      lastname,
      email,
      password,
      course,
      yearOfStudy,
      registrationNumber,
    } = body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !course ||
      !yearOfStudy ||
      !registrationNumber
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Check duplicate reg number in student
    const [existing]: any = await pool.query(
      "SELECT id FROM student WHERE registrationNumber = ?",
      [registrationNumber]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Registration Number already registered" },
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert into users
    const [userResult]: any = await pool.query(
      "INSERT INTO users (firstname, lastname, email, password, role) VALUES (?, ?, ?, ?, 'STUDENT')",
      [firstname, lastname, email, hashedPassword]
    );

    const userId = userResult.insertId;

    // ✅ Insert into student
    await pool.query(
      "INSERT INTO student (id, course, yearOfStudy, registrationNumber) VALUES (?, ?, ?, ?)",
      [userId, course, yearOfStudy, registrationNumber]
    );

    // ✅ Fetch the full student object to return
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, 
              s.course, s.yearOfStudy, s.registrationNumber
       FROM users u
       JOIN student s ON u.id = s.id
       WHERE u.id = ?`,
      [userId]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /student error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
