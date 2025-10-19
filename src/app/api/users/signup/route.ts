import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/dbConfig/dbConfig";

export async function POST(request: NextRequest) {
  try {
    console.log("📩 Incoming signup request...");

    const {
      firstname,
      lastname,
      email,
      password,
      role,
      yearOfStudy,
      course,
      registrationNumber,
      employeeNumber,
    } = await request.json();

    const upperRole = role?.toUpperCase();
    console.log("➡️ Payload:", {
      firstname,
      lastname,
      email,
      role: upperRole,
      yearOfStudy,
      course,
      registrationNumber,
      employeeNumber,
    });

    // 🚨 Validate role
    if (!["ADMIN", "LECTURER", "STUDENT"].includes(upperRole)) {
      return NextResponse.json(
        { error: "Invalid role provided." },
        { status: 400 }
      );
    }

    // 🚫 Only one admin allowed
    if (upperRole === "ADMIN") {
      const [adminExists]: any = await pool.query(
        "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
      );
      if (adminExists.length > 0) {
        return NextResponse.json(
          { error: "An admin already exists. Only one admin is allowed." },
          { status: 400 }
        );
      }
    }

    // 👨‍🏫 Lecturer: employeeNumber must be unique
    if (upperRole === "LECTURER") {
      const [exists]: any = await pool.query(
        "SELECT id FROM lecturer WHERE employeeNumber = ?",
        [employeeNumber]
      );
      if (exists.length > 0) {
        return NextResponse.json(
          { error: "A lecturer with that employee number already exists." },
          { status: 400 }
        );
      }
    }

    // 🎓 Student: registrationNumber must be unique
    if (upperRole === "STUDENT") {
      const [exists]: any = await pool.query(
        "SELECT id FROM student WHERE registrationNumber = ?",
        [registrationNumber]
      );
      if (exists.length > 0) {
        return NextResponse.json(
          { error: "A student with that registration number already exists." },
          { status: 400 }
        );
      }
    }

    // ✉️ Email uniqueness check
    if (email) {
      const [emailExists]: any = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "A user with that email already exists." },
          { status: 400 }
        );
      }
    }

    // 🔑 Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // 🧑‍💼 Create user in users table
    const [userResult]: any = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [firstname, lastname, email || null, hashedPassword, upperRole]
    );

    const userId = userResult.insertId;

    // 🎓 Student-specific insert
    if (upperRole === "STUDENT") {
      await pool.query(
        `INSERT INTO student (id, course, yearOfStudy, registrationNumber)
         VALUES (?, ?, ?, ?)`,
        [userId, course, yearOfStudy, registrationNumber]
      );
    }

    // 👨‍🏫 Lecturer-specific insert
    if (upperRole === "LECTURER") {
      await pool.query(
        `INSERT INTO lecturer (userId, employeeNumber)
         VALUES (?, ?)`,
        [userId, employeeNumber]
      );
    }

    console.log(`✅ ${upperRole} signup successful (userId: ${userId})`);


    return NextResponse.json({
      message: `${upperRole} registered successfully`,
      success: true,
      userId,
    });
  } catch (error: any) {
    console.error("🔥 Signup API error:", error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
