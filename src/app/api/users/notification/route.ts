import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

/**
 * Fetch full user details including role, course, and year.
 */
async function getFullUser(userId: number) {
  const [users]: any = await pool.query(
    `SELECT 
      u.id, u.firstname, u.lastname, u.email, u.role, 
      s.course, s.yearOfStudy, s.registrationNumber
     FROM users u
     LEFT JOIN student s ON u.id = s.id 
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return users.length ? users[0] : null;
}

// ----------------------------------------------------------------------
// --- GET (Fetch Notifications Per User or Sent Ones) ---
// ----------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "system"; // "system" | "sent"

  const fullUser = await getFullUser((user as any).id);
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    let query = "";
    let params: any[] = [];

    // ------------------------------------------------------------------
    // SYSTEM NOTIFICATIONS — ones RECEIVED by the logged-in user
    // ------------------------------------------------------------------
    if (type === "system") {
      if (fullUser.role === "STUDENT") {
        query = `
          SELECT 
            n.id,
            n.title,
            COALESCE(n.detail, n.message) AS message,
            n.unit,
            n.venue,
            n.classTime,
            n.createdAt,
            u.firstname AS lecturer,
            un.readStatus,
            un.deleted
          FROM notification n
          LEFT JOIN user_notification un ON n.id = un.notificationId AND un.userId = ?
          LEFT JOIN users u ON u.id = n.senderId
          WHERE 
            (
              (n.targetType = 'USER' AND n.targetUserId = ?)
              OR (n.targetType = 'COURSE' AND n.targetCourse = ? AND (n.targetYear = ? OR n.targetYear IS NULL))
              OR n.targetType = 'ALL_STUDENTS'
            )
            AND (un.deleted IS NULL OR un.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id, fullUser.id, fullUser.course, fullUser.yearOfStudy];
      } else if (fullUser.role === "LECTURER") {
        query = `
          SELECT 
            n.id, 
            n.title, 
            COALESCE(n.detail, n.message) AS message,
            n.createdAt, 
            n.senderId, 
            un.readStatus
          FROM notification n
          LEFT JOIN user_notification un ON n.id = un.notificationId AND un.userId = ?
          WHERE 
            (n.targetType = 'ALL_LECTURERS' OR (n.targetType = 'USER' AND n.targetUserId = ?))
            AND (un.deleted IS NULL OR un.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id, fullUser.id];
      } else if (fullUser.role === "ADMIN") {
        query = `
          SELECT 
            n.id,
            n.title,
            COALESCE(n.detail, n.message) AS message,
            n.createdAt,
            un.readStatus
          FROM notification n
          LEFT JOIN user_notification un ON n.id = un.notificationId AND un.userId = ?
          WHERE 
            (n.targetType = 'ADMIN' OR n.targetType = 'ALL_ADMINS')
            AND (un.deleted IS NULL OR un.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id];
      }
    }

    // ------------------------------------------------------------------
    // SENT NOTIFICATIONS — ones AUTHORED by the logged-in user
    // ------------------------------------------------------------------
    else if (type === "sent") {
      query = `
        SELECT 
          n.id,
          n.title,
          n.message,
          n.targetType,
          n.targetCourse,
          n.targetYear,
          n.createdAt
        FROM notification n
        WHERE n.senderId = ?
        ORDER BY n.createdAt DESC
      `;
      params = [fullUser.id];
    }

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("❌ GET Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// --- POST (Create Notification + Initialize User Records) ---
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;
  const senderId = (user as any).id;

  const fullUser = await getFullUser(senderId);
  if (!fullUser) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  if (fullUser.role === "STUDENT")
    return NextResponse.json({ error: "Students cannot send notifications" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      title,
      message,
      targetType,
      targetCourse,
      targetYear,
      targetRegNo,
      targetEmail,
      venue,
      unit,
      detail,
      classTime,
    } = body;

    if (!title || !message || !targetType)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let targetUserId = 0;
    let finalTargetCourse = targetCourse || null;
    let finalTargetYear = targetYear || null;

    // Target a single student
    if (targetType === "USER" && targetRegNo) {
      const [studentResult]: any = await pool.query(
        "SELECT id FROM student WHERE registrationNumber = ? LIMIT 1",
        [targetRegNo]
      );
      if (!studentResult.length)
        return NextResponse.json({ error: `Student ${targetRegNo} not found.` }, { status: 404 });
      targetUserId = studentResult[0].id;
    }

    // Target a single admin
    else if (targetType === "ADMIN" && targetEmail) {
      const [adminResult]: any = await pool.query(
        "SELECT id FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1",
        [targetEmail]
      );
      if (!adminResult.length)
        return NextResponse.json({ error: `Admin ${targetEmail} not found.` }, { status: 404 });
      targetUserId = adminResult[0].id;
    }

    // Always ensure detail exists
    const finalDetail = detail || message;

    // Insert notification
    const [insertResult]: any = await pool.query(
      `INSERT INTO notification 
        (senderId, title, message, targetType, targetUserId, targetCourse, targetYear, 
         venue, unit, detail, classTime, readStatus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        senderId,
        title,
        message,
        targetType,
        targetUserId,
        finalTargetCourse,
        finalTargetYear,
        venue || null,
        unit || null,
        finalDetail,
        classTime || null,
      ]
    );

    const notificationId = insertResult.insertId;

    // Initialize user_notification for each targeted user
    if (targetType === "COURSE" && finalTargetCourse) {
      const [students]: any = await pool.query(
        "SELECT id FROM student WHERE course = ? AND (yearOfStudy = ? OR ? IS NULL)",
        [finalTargetCourse, finalTargetYear, finalTargetYear]
      );
      if (students.length) {
        const values = students.map((s: any) => [notificationId, s.id]);
        await pool.query(
          "INSERT INTO user_notification (notificationId, userId) VALUES ?",
          [values]
        );
      }
    } else if (targetType === "ALL_STUDENTS") {
      const [allStudents]: any = await pool.query("SELECT id FROM student");
      if (allStudents.length) {
        const values = allStudents.map((s: any) => [notificationId, s.id]);
        await pool.query(
          "INSERT INTO user_notification (notificationId, userId) VALUES ?",
          [values]
        );
      }
    } else if (targetType === "USER" && targetUserId) {
      await pool.query(
        "INSERT INTO user_notification (notificationId, userId) VALUES (?, ?)",
        [notificationId, targetUserId]
      );
    }

    return NextResponse.json({ message: "Notification sent successfully" });
  } catch (err: any) {
    console.error("❌ POST Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
