import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import bcryptjs from "bcryptjs";

// 🔹 Create a lecturer
export async function POST(request: NextRequest) {
  try {
    const { firstname, lastname, email, password, employeeNumber } =
      await request.json();

    if (!firstname || !lastname || !email || !password || !employeeNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // ✅ insert into users table with role = LECTURER
    const [userResult]: any = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role)
       VALUES (?, ?, ?, ?, 'LECTURER')`,
      [firstname, lastname, email, hashedPassword]
    );

    const userId = userResult.insertId;

    // ✅ insert into lecturer table (FK -> users.id)
    await pool.query(
      `INSERT INTO lecturer (userId, employeeNumber) VALUES (?, ?)`,
      [userId, employeeNumber]
    );

    // ✅ fetch full lecturer object
    const [lecturer]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM users u
       JOIN lecturer l ON u.id = l.userId
       WHERE u.id = ?`,
      [userId]
    );

    return NextResponse.json(lecturer[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Get all lecturers
export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM lecturer l
       JOIN users u ON l.userId = u.id
       WHERE u.role = 'LECTURER'`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
