import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "@/dbConfig/dbConfig";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("📩 Incoming login request:", { email });

    // get user by email
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      console.warn("❌ User not found:", email);
      return NextResponse.json({ error: "User doesn't exist" }, { status: 400 });
    }

    const user = rows[0];
    console.log("✅ User found:", user.username);

    // validate password
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      console.warn("❌ Invalid password attempt for:", email);
      return NextResponse.json({ error: "Password did not match" }, { status: 400 });
    }

    // token payload
    const tokenData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // sign JWT
    const token = jwt.sign(tokenData, process.env.JWT_TOKEN_SECRET!, { expiresIn: "1d" });

    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      role: user.role,
    });

    response.cookies.set("token", token, { httpOnly: true, secure: true, sameSite: "strict" });
    console.log("✅ Login successful:", email);

    return response;
  } catch (error: any) {
    console.error("🔥 Login error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
