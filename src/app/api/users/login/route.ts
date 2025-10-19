import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/dbConfig/dbConfig";

export async function POST(request: NextRequest) {
  try {
    const { email, password, registrationNumber, employeeNumber, role } =
      await request.json();

    console.log("📩 Login request received for role:", role);

    let query = "";
    let value: any[] = [];

    // Decide which identifier to use
    if (role === "ADMIN") {
      query = "SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1";
      value = [email];
    } else if (role === "LECTURER") {
      query = `
        SELECT u.*, l.employeeNumber 
        FROM users u 
        JOIN lecturer l ON l.userId = u.id 
        WHERE l.employeeNumber = ? AND u.role = 'LECTURER' 
        LIMIT 1
      `;
      value = [employeeNumber];
    } else if (role === "STUDENT") {
      query = `
        SELECT u.*, s.registrationNumber 
        FROM users u 
        JOIN student s ON s.id = u.id 
        WHERE s.registrationNumber = ? AND u.role = 'STUDENT' 
        LIMIT 1
      `;
      value = [registrationNumber];
    } else {
      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(query, value);

    if (rows.length === 0) {
      console.warn("❌ User not found for role:", role);
      return NextResponse.json(
        { message: "Account not found. Please check your credentials." },
        { status: 400 }
      );
    }

    const user = rows[0];
    console.log("✅ User record found:", user.firstname, user.lastname);

    // Validate password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("❌ Incorrect password for user:", user.id);
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 400 }
      );
    }

    // Prepare token payload
    const tokenData = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    };

    // Sign JWT token
    const token = jwt.sign(tokenData, process.env.JWT_TOKEN_SECRET!, {
      expiresIn: "1d",
    });

    // Send token as cookie
    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      role: user.role,
      fullname: `${user.firstname} ${user.lastname}`,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    console.log("✅ Login success for:", user.role);
    return response;
  } catch (error: any) {
    console.error("🔥 Login error:", error.message);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
