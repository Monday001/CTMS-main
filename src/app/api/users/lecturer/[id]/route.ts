import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/dbConfig/dbConfig";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows]: any = await pool.query(
      `SELECT l.id, l.employeeNumber, u.username, u.email
       FROM lecturer l
       JOIN user u ON l.userId = u.id
       WHERE l.id = ?`,
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { firstname, lastname, email, password, employeeNumber } = await request.json();

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashedPassword = await bcryptjs.hash(password, salt);
    }

    // update user info
    await pool.query(
      `UPDATE user u
       JOIN lecturer l ON u.id = l.userId
       SET u.username = ?, u.email = ?, u.password = ?, l.employeeNumber = ?
       WHERE l.id = ?`,
      [firstname + " " + lastname, email, hashedPassword || null, employeeNumber, params.id]
    );

    return NextResponse.json({ message: "Lecturer updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM lecturer WHERE id = ?", [params.id]);
    return NextResponse.json({ message: "Lecturer deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
