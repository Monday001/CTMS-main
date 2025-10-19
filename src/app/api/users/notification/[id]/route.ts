import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

async function getFullUser(userId: number) {
  const [users]: any = await pool.query(
    `SELECT u.id, u.firstname, u.lastname, u.role, s.course, s.yearOfStudy 
     FROM users u
     LEFT JOIN student s ON u.id = s.id
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return users.length ? users[0] : null;
}

// ----------------------------------------------------------------------
// PATCH: Mark single notification as read for this user only
// ----------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  const notificationId = params.id;
  const fullUser = await getFullUser((user as any).id);
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    await pool.query(
      `UPDATE user_notification SET readStatus = 1 WHERE notificationId = ? AND userId = ?`,
      [notificationId, fullUser.id]
    );
    return NextResponse.json({ message: "Marked as read" });
  } catch (err: any) {
    console.error("❌ PATCH Read Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE: Soft delete for student or actual delete for sender
// ----------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { valid, user, response } = verifyToken(request);
  if (!valid) return response;

  const fullUser = await getFullUser((user as any).id);
  if (!fullUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notificationId = params.id;

  try {
    if (fullUser.role === "STUDENT") {
      await pool.query(
        `UPDATE user_notification SET deleted = 1 WHERE notificationId = ? AND userId = ?`,
        [notificationId, fullUser.id]
      );
      return NextResponse.json({ message: "Notification hidden for student" });
    } else {
      await pool.query("DELETE FROM notification WHERE id = ?", [notificationId]);
      return NextResponse.json({ message: "Notification deleted successfully" });
    }
  } catch (err: any) {
    console.error("❌ DELETE Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
