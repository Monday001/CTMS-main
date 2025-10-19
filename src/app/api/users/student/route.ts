import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import bcrypt from "bcryptjs";
import { createSystemNotification, notifyAdmins } from "@/utils/notifications";
import { verifyToken } from "@/lib/auth"; // ✅ Token verification

// 🔹 Get all students
export async function GET(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

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
    console.error("❌ GET /student error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Create student
export async function POST(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const {
      firstname,
      lastname,
      email,
      password,
      course,
      yearOfStudy,
      registrationNumber,
    } = await request.json();

    if (!firstname || !lastname || !email || !password || !course || !yearOfStudy || !registrationNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Check duplicate registration number
    const [existing]: any = await pool.query(
      "SELECT id FROM student WHERE registrationNumber = ?",
      [registrationNumber]
    );
    if (existing.length > 0)
      return NextResponse.json({ error: "Registration Number already registered" }, { status: 400 });

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

    // ✅ Notifications
    await createSystemNotification({
      title: "Welcome to the System",
      message: `Hello ${firstname}, your student account has been created successfully.`,
      targetType: "USER",
      targetUserId: userId,
    });

    await notifyAdmins({
      title: "New Student Added",
      message: `Student ${firstname} ${lastname} (${registrationNumber}) has been added by ${currentUser.firstname} ${currentUser.lastname}.`,
    });

    // ✅ Fetch full student details
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
    console.error("❌ POST /student error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
