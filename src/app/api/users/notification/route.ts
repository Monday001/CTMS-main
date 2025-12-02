import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

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
  console.log("🔹 getFullUser result:", users);
  return users.length ? users[0] : null;
}

/* -------------------- GET: Fetch Notifications -------------------- */
export async function GET(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "system";

  const fullUser = await getFullUser((user as any).id);
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  console.log(`🔹 GET notifications for user ${fullUser.id} (${fullUser.role}), type: ${type}`);

  try {
    let query = "";
    let params: any[] = [];

    if (type === "system") {
      if (fullUser.role === "STUDENT") {
        query = `
          SELECT 
            n.id, n.title,
            COALESCE(n.detail, n.message) AS message,
            n.unitCode, n.venue, n.classTime, n.createdAt,
            u.firstname AS lecturer,
            nu.readStatus, nu.deleted
          FROM notification n
          LEFT JOIN notification_user nu ON n.id = nu.notificationId AND nu.userId = ?
          LEFT JOIN users u ON u.id = n.senderId
          WHERE (
              (n.targetType = 'USER' AND n.targetUserId = ?)
              OR (n.targetType = 'COURSE' AND n.targetCourse = ? AND (n.targetYear = ? OR n.targetYear IS NULL))
              OR n.targetType = 'ALL_STUDENTS'
            )
            AND (nu.deleted IS NULL OR nu.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id, fullUser.id, fullUser.course, fullUser.yearOfStudy];
      } else if (fullUser.role === "LECTURER") {
        query = `
          SELECT 
            n.id, n.title, COALESCE(n.detail, n.message) AS message,
            n.createdAt, n.senderId, nu.readStatus
          FROM notification n
          LEFT JOIN notification_user nu ON n.id = nu.notificationId AND nu.userId = ?
          WHERE (n.targetType = 'ALL_LECTURERS' OR (n.targetType = 'USER' AND n.targetUserId = ?))
            AND (nu.deleted IS NULL OR nu.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id, fullUser.id];
      } else if (fullUser.role === "ADMIN") {
        query = `
          SELECT 
            n.id, n.title,
            COALESCE(n.detail, n.message) AS message,
            n.createdAt, nu.readStatus
          FROM notification n
          LEFT JOIN notification_user nu ON n.id = nu.notificationId AND nu.userId = ?
          WHERE (n.targetType = 'ADMIN' OR n.targetType = 'ALL_ADMINS')
            AND (nu.deleted IS NULL OR nu.deleted = 0)
          ORDER BY n.createdAt DESC
        `;
        params = [fullUser.id];
      }
    } else if (type === "sent") {
      query = `
        SELECT 
          n.id, n.title, n.message, n.targetType,
          n.targetCourse, n.targetYear, n.createdAt
        FROM notification n
        WHERE n.senderId = ?
        ORDER BY n.createdAt DESC
      `;
      params = [fullUser.id];
    }

    const [rows]: any = await pool.query(query, params);
    console.log(`🔹 Fetched ${rows.length} notifications for user ${fullUser.id}`);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("❌ GET Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------- POST: Send Notification -------------------- */
export async function POST(request: NextRequest) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;
  const senderId = (user as any).id;

  const fullUser = await getFullUser(senderId);
  if (!fullUser) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  if (fullUser.role === "STUDENT")
    return NextResponse.json({ error: "Students cannot send notifications" }, { status: 403 });

  console.log(`🔹 Sending notification as user ${fullUser.id} (${fullUser.role})`);

  try {
    const body = await request.json();
    const { title, message, targetType, targetCourse, targetYear, targetRegNo, targetEmail, venue, unit, detail, classTime } = body;

    if (!title || !message || !targetType)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    let targetUserId = 0;
    let finalTargetCourse = targetCourse || null;
    let finalTargetYear = targetYear || null;

    if (targetType === "USER" && targetRegNo) {
      const [student]: any = await pool.query(
        "SELECT id FROM student WHERE registrationNumber = ? LIMIT 1",
        [targetRegNo]
      );
      if (!student.length)
        return NextResponse.json({ error: `Student ${targetRegNo} not found.` }, { status: 404 });
      targetUserId = student[0].id;
      console.log(`🔹 Targeting USER ${targetUserId}`);
    } else if (targetType === "ADMIN" && targetEmail) {
      const [admin]: any = await pool.query(
        "SELECT id FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1",
        [targetEmail]
      );
      if (!admin.length)
        return NextResponse.json({ error: `Admin ${targetEmail} not found.` }, { status: 404 });
      targetUserId = admin[0].id;
      console.log(`🔹 Targeting ADMIN ${targetUserId}`);
    }

    const finalDetail = detail || message;

    const [insertResult]: any = await pool.query(
      `INSERT INTO notification 
       (senderId, title, message, targetType, targetUserId, targetCourse, targetYear,
        venue, unitCode, detail, classTime, readStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [senderId, title, message, targetType, targetUserId, finalTargetCourse, finalTargetYear, venue || null, unit || null, finalDetail, classTime || null]
    );

    const notificationId = insertResult.insertId;
    console.log(`🔹 Notification created with ID ${notificationId}`);

    // Link notification to users
    let linkedCount = 0;
    if (targetType === "COURSE" && finalTargetCourse) {
      const [students]: any = await pool.query(
        "SELECT id FROM student WHERE course = ? AND (yearOfStudy = ? OR ? IS NULL)",
        [finalTargetCourse, finalTargetYear, finalTargetYear]
      );
      const values = students.map((s: any) => [notificationId, s.id]);
      if (values.length) {
        const [res]: any = await pool.query("INSERT INTO notification_user (notificationId, userId) VALUES ?", [values]);
        linkedCount = res.affectedRows || values.length;
      }
    } else if (targetType === "ALL_STUDENTS") {
      const [students]: any = await pool.query("SELECT id FROM student");
      const values = students.map((s: any) => [notificationId, s.id]);
      if (values.length) {
        const [res]: any = await pool.query("INSERT INTO notification_user (notificationId, userId) VALUES ?", [values]);
        linkedCount = res.affectedRows || values.length;
      }
    } else if (targetType === "USER" && targetUserId) {
      const [res]: any = await pool.query("INSERT INTO notification_user (notificationId, userId) VALUES (?, ?)", [notificationId, targetUserId]);
      linkedCount = res.affectedRows || 1;
    }

    console.log(`🔹 Notification linked to ${linkedCount} users`);
    return NextResponse.json({ success: true, message: "Notification sent successfully", notificationId, linkedCount });
  } catch (err: any) {
    console.error("❌ POST Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
