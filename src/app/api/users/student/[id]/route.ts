import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { createSystemNotification } from "@/utils/notifications";
import { verifyToken } from "@/lib/auth"; // ✅ Token verification

// 🔹 Get one student
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, 
              s.course, s.yearOfStudy, s.registrationNumber
       FROM users u
       JOIN student s ON u.id = s.id
       WHERE u.role = 'STUDENT' AND u.id = ?`,
      [params.id]
    );

    if (rows.length === 0)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("❌ Student GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Update student
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { firstname, lastname, email, course, yearOfStudy, registrationNumber } =
      await request.json();

    if (!firstname || !lastname || !email || !course || !yearOfStudy || !registrationNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `UPDATE users u
       JOIN student s ON u.id = s.id
       SET u.firstname = ?, u.lastname = ?, u.email = ?,
           s.course = ?, s.yearOfStudy = ?, s.registrationNumber = ?
       WHERE u.id = ? AND u.role = 'STUDENT'`,
      [firstname, lastname, email, course, yearOfStudy, registrationNumber, params.id]
    );

    if (result.affectedRows === 0)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    await createSystemNotification({
      title: "Student Updated",
      message: `Details for student ${firstname} ${lastname} have been updated by ${currentUser.firstname} ${currentUser.lastname}.`,
      targetType: "USER",
      targetUserId: Number(params.id),
    });

    return NextResponse.json({ message: "Student updated successfully" });
  } catch (error: any) {
    console.error("❌ Student update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Delete student
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const [student]: any = await pool.query(
      "SELECT u.firstname, u.lastname FROM users u WHERE u.id = ? AND u.role = 'STUDENT'",
      [params.id]
    );

    if (student.length === 0)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const { firstname, lastname } = student[0];

    await pool.query("DELETE FROM student WHERE id = ?", [params.id]);
    await pool.query("DELETE FROM users WHERE id = ?", [params.id]);

    await createSystemNotification({
      title: "Student Removed",
      message: `Student ${firstname} ${lastname} was removed by ${currentUser.firstname} ${currentUser.lastname}.`,
      targetType: "USER",
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("❌ Student deletion error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
