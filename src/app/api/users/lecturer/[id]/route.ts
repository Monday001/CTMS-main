import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/dbConfig/dbConfig";

// 🔹 Get one lecturer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.firstname, u.lastname, u.email, u.role, l.employeeNumber
       FROM lecturer l
       JOIN users u ON l.userId = u.id
       WHERE u.id = ? AND u.role = 'LECTURER'`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Update lecturer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({ message: "Lecturer updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔹 Delete lecturer (and linked user)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ensure lecturer exists
    const [lecturer]: any = await pool.query(
      "SELECT userId FROM lecturer WHERE userId = ?",
      [params.id]
    );

    if (lecturer.length === 0) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    await pool.query("DELETE FROM lecturer WHERE userId = ?", [params.id]);
    await pool.query("DELETE FROM users WHERE id = ?", [params.id]);

    return NextResponse.json({ message: "Lecturer deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
