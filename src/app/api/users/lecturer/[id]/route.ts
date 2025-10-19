import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/dbConfig/dbConfig";
import { createSystemNotification } from "@/utils/notifications";
import { verifyToken } from "@/lib/auth"; // ✅ Token validator

// 🔹 Helper to get a full user
async function getFullUser(userId: number) {
  const [users]: any = await pool.query(
    `SELECT id, firstname, lastname, email, role FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return users.length > 0 ? users[0] : null;
}

// 🔹 GET one lecturer
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM lecturer l
       JOIN users u ON l.userId = u.id
       WHERE u.id = ? AND u.role = 'LECTURER'`,
      [params.id]
    );

    if (rows.length === 0)
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("❌ Lecturer GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 UPDATE lecturer
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { firstname, lastname, email, password, employeeNumber } =
      await request.json();

    let hashedPassword: string | null = null;
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashedPassword = await bcryptjs.hash(password, salt);
    }

    if (hashedPassword) {
      await pool.query(
        `UPDATE users u
         JOIN lecturer l ON u.id = l.userId
         SET u.firstname = ?, u.lastname = ?, u.email = ?, u.password = ?, l.employeeNumber = ?
         WHERE u.id = ? AND u.role = 'LECTURER'`,
        [firstname, lastname, email, hashedPassword, employeeNumber, params.id]
      );
    } else {
      await pool.query(
        `UPDATE users u
         JOIN lecturer l ON u.id = l.userId
         SET u.firstname = ?, u.lastname = ?, u.email = ?, l.employeeNumber = ?
         WHERE u.id = ? AND u.role = 'LECTURER'`,
        [firstname, lastname, email, employeeNumber, params.id]
      );
    }

    await createSystemNotification({
      title: "Lecturer Updated",
      message: `Details for lecturer ${firstname} ${lastname} have been updated by ${currentUser.firstname} ${currentUser.lastname}.`,
      targetType: "USER",
      targetUserId: Number(params.id),
    });

    return NextResponse.json({ message: "Lecturer updated successfully" });
  } catch (error: any) {
    console.error("❌ Lecturer update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 DELETE lecturer
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  try {
    const currentUser = user as any;
    if (currentUser.role !== "ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const [lecturer]: any = await pool.query(
      "SELECT u.firstname, u.lastname FROM users u WHERE u.id = ? AND u.role = 'LECTURER'",
      [params.id]
    );

    if (lecturer.length === 0)
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });

    const { firstname, lastname } = lecturer[0];

    await pool.query("DELETE FROM lecturer WHERE userId = ?", [params.id]);
    await pool.query("DELETE FROM users WHERE id = ?", [params.id]);

    await createSystemNotification({
      title: "Lecturer Removed",
      message: `Lecturer ${firstname} ${lastname} has been removed by ${currentUser.firstname} ${currentUser.lastname}.`,
    });

    return NextResponse.json({ message: "Lecturer deleted successfully" });
  } catch (error: any) {
    console.error("❌ Lecturer deletion error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
