import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/dbConfig/dbConfig";

/**
 * Signup API – Creates Student, Lecturer, or Admin
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📩 Incoming signup request...");

    const {
      username,
      email,
      password,
      role,
      yearOfStudy,
      course,
      registrationNumber,
      employeeNumber,
    } = await request.json();

    console.log("➡️ Payload:", {
      username,
      email,
      role,
      yearOfStudy,
      course,
      registrationNumber,
      employeeNumber,
    });

    // check if user already exists
    console.log("🔍 Checking if user exists...");
    const [existing]: any = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    console.log("Existing user query result:", existing);

    if (existing.length > 0) {
      console.log("❌ User already exists");
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 🚨 ensure only one admin
    if (role?.toUpperCase() === "ADMIN") {
      console.log("🔍 Checking if admin already exists...");
      const [adminCheck]: any = await pool.query(
        "SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1"
      );
      console.log("Admin check result:", adminCheck);

      if (adminCheck.length > 0) {
        console.log("❌ Admin already exists");
        return NextResponse.json(
          { error: "An admin already exists. Only one admin account is allowed." },
          { status: 400 }
        );
      }
    }

    // hash password
    console.log("🔑 Hashing password...");
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    console.log("Password hashed successfully");

    // insert into users table
    console.log("📝 Inserting into users table...");
    const [result]: any = await pool.query(
      `INSERT INTO users (username, email, password, role, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, role.toUpperCase()]
    );
    console.log("Insert result:", result);

    const userId = result.insertId;
    console.log("✅ New userId:", userId);

    // role-specific inserts
    if (role?.toUpperCase() === "STUDENT") {
      console.log("🎓 Inserting into student table...");
      await pool.query(
        `INSERT INTO student (userId, course, yearOfStudy, registrationNumber) 
         VALUES (?, ?, ?, ?)`,
        [userId, course, yearOfStudy, registrationNumber]
      );
    } else if (role?.toUpperCase() === "LECTURER") {
      console.log("👨‍🏫 Inserting into lecturer table...");
      await pool.query(
        `INSERT INTO lecturer (userId, employeeNumber) VALUES (?, ?)`,
        [userId, employeeNumber]
      );
    }

    console.log("✅ Signup completed successfully");
    return NextResponse.json({
      message: "User created successfully",
      success: true,
      userId,
    });
  } catch (error: any) {
    console.error("🔥 Signup API error:", error); // full error
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
