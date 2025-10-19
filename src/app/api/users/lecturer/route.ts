import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import bcrypt from "bcryptjs";
import { createSystemNotification } from "@/utils/notifications";
import { verifyToken } from "@/lib/auth"; // ✅ Secure endpoints

// 🔹 GET all lecturers
export async function GET(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM users u
       JOIN lecturer l ON u.id = l.userId
       WHERE u.role = 'LECTURER'`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ GET /lecturer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 CREATE lecturer
export async function POST(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { firstname, lastname, email, password, employeeNumber } =
      await request.json();

    if (!firstname || !lastname || !email || !password || !employeeNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Check duplicate employee number
    const [existing]: any = await pool.query(
      "SELECT id FROM lecturer WHERE employeeNumber = ?",
      [employeeNumber]
    );

    if (existing.length > 0)
      return NextResponse.json(
        { error: "Employee Number already registered" },
        { status: 400 }
      );

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert into users
    const [userResult]: any = await pool.query(
      "INSERT INTO users (firstname, lastname, email, password, role) VALUES (?, ?, ?, ?, 'LECTURER')",
      [firstname, lastname, email, hashedPassword]
    );

    const userId = userResult.insertId;

    // ✅ Insert into lecturer
    await pool.query(
      "INSERT INTO lecturer (userId, employeeNumber) VALUES (?, ?)",
      [userId, employeeNumber]
    );

    // ✅ Create system notification
    await createSystemNotification({
      title: "New Lecturer Added",
      message: `Lecturer ${firstname} ${lastname} has been added by ${currentUser.firstname} ${currentUser.lastname}.`,
      targetType: "USER",
      targetUserId: userId,
    });

    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM users u
       JOIN lecturer l ON u.id = l.userId
       WHERE u.id = ?`,
      [userId]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("❌ POST /lecturer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
