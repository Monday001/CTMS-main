import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import jwt from "jsonwebtoken";

/**
 * Helper: extract user data from JWT
 */
async function getDataFromToken(request: NextRequest) {
  const token = request.cookies.get("token")?.value || "";
  if (!token) throw new Error("No token provided");

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_TOKEN_SECRET!);
    return decoded; // { id, username, email, role }
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Fetch full user data from DB (joins student if exists)
 */
async function getFullUser(userId: number) {
  const [users]: any = await pool.query(
    `SELECT u.id, u.username, u.role, s.course, s.yearOfStudy 
     FROM users u
     LEFT JOIN student s ON u.id = s.userId
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return users.length ? users[0] : null;
}

/**
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const {
      lecturer,
      venue,
      unit,
      saa,
      detail,
      targetUserId,
      targetCourse,
      targetYear,
    } = await request.json();

    const [result]: any = await pool.query(
      `INSERT INTO notification (lecturer, venue, unit, saa, detail, targetUserId, targetCourse, targetYear) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lecturer,
        venue,
        unit,
        saa,
        detail,
        targetUserId || null,
        targetCourse || null,
        targetYear || null,
      ]
    );

    return NextResponse.json({
      message: "Notification created successfully",
      success: true,
      notificationId: result.insertId,
    });
  } catch (error: any) {
    console.error("POST Notification Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Fetch notifications for logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getDataFromToken(request);
    const user = await getFullUser(currentUser.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let query = `SELECT * FROM notification WHERE 1=0`;
    let params: any[] = [];

    if (user.role === "STUDENT") {
      query = `
        SELECT * FROM notification 
        WHERE targetUserId = ? 
           OR (targetCourse = ? AND targetYear = ?) 
           OR (targetCourse = ? AND targetYear IS NULL)
        ORDER BY createdAt DESC
      `;
      params = [user.id, user.course, user.yearOfStudy, user.course];
    } else {
      query = `
        SELECT * FROM notification 
        WHERE targetUserId = ? 
        ORDER BY createdAt DESC
      `;
      params = [user.id];
    }

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET Notification Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Update notification by ID (Admins can edit all, Lecturers only their own)
 */
export async function PUT(request: NextRequest) {
  try {
    const {
      id,
      lecturer,
      venue,
      unit,
      saa,
      detail,
      targetUserId,
      targetCourse,
      targetYear,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const currentUser = await getDataFromToken(request);
    const user = await getFullUser(currentUser.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized: Students cannot edit notifications" },
        { status: 403 }
      );
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM notification WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = rows[0];

    if (user.role === "LECTURER" && notification.lecturer !== user.username) {
      return NextResponse.json(
        { error: "Unauthorized: You can only edit your own notifications" },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      `UPDATE notification 
       SET lecturer = ?, venue = ?, unit = ?, saa = ?, detail = ?, targetUserId = ?, targetCourse = ?, targetYear = ?
       WHERE id = ?`,
      [
        lecturer,
        venue,
        unit,
        saa,
        detail,
        targetUserId || null,
        targetCourse || null,
        targetYear || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Notification updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT Notification Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Delete notification by ID (Admins can delete all, Lecturers only their own)
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const currentUser = await getDataFromToken(request);
    const user = await getFullUser(currentUser.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized: Students cannot delete notifications" },
        { status: 403 }
      );
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM notification WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const notification = rows[0];

    if (user.role === "LECTURER" && notification.lecturer !== user.username) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own notifications" },
        { status: 403 }
      );
    }

    const [result]: any = await pool.query(
      "DELETE FROM notification WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE Notification Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
