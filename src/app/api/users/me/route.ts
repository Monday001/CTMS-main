import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import jwt from "jsonwebtoken";

async function getDataFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value || "";

    if (!token) {
      throw new Error("Token not found");
    }

    // verify and decode the JWT
    const decodedToken: any = jwt.verify(token, process.env.JWT_TOKEN_SECRET!);

    return decodedToken.id; // return the userId stored in the payload
  } catch (error: any) {
    throw new Error("Invalid or expired token");
  }
}

export async function GET(request: NextRequest) {
  try {
    // extract user ID from JWT
    const userID = await getDataFromToken(request);

    // fetch base user info
    const [users]: any = await pool.query(
      "SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1",
      [userID]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    let extraData: any = {};

    // fetch role-specific details
    if (user.role === "STUDENT") {
      const [students]: any = await pool.query(
        "SELECT registrationNumber, course, yearOfStudy FROM student WHERE userId = ? LIMIT 1",
        [user.id]
      );
      if (students.length > 0) {
        extraData = students[0];
      }
    } else if (user.role === "LECTURER") {
      const [lecturers]: any = await pool.query(
        "SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1",
        [user.id]
      );
      if (lecturers.length > 0) {
        extraData = lecturers[0];
      }
    }

    return NextResponse.json({
      message: "User Found",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ...extraData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
