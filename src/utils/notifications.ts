import pool from "@/dbConfig/dbConfig";

/**
 * Create a system notification for a specific user or system-wide
 */
export async function createSystemNotification({
  title,
  message,
  targetType = "USER",
  targetUserId = null,
  targetCourse = null,
  targetYear = null,
}: {
  title: string;
  message: string;
  targetType?: "USER" | "COURSE" | "COURSE_YEAR";
  targetUserId?: number | null;
  targetCourse?: string | null;
  targetYear?: number | null;
}) {
  try {
    await pool.query(
      `INSERT INTO notification 
       (senderId, title, message, targetType, targetUserId, targetCourse, targetYear, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SYSTEM')`,
      [null, title, message, targetType, targetUserId, targetCourse, targetYear]
    );
    console.log("✅ System notification created:", title);
  } catch (error: any) {
    console.error("❌ Failed to create system notification:", error.message);
  }
}

/**
 * Notify all admins about a system event
 */
export async function notifyAdmins({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  try {
    const [admins]: any = await pool.query(
      "SELECT id FROM users WHERE role = 'ADMIN'"
    );

    for (const admin of admins) {
      await createSystemNotification({
        title,
        message,
        targetType: "USER",
        targetUserId: admin.id,
      });
    }

    console.log(`✅ Notified ${admins.length} admin(s)`);
  } catch (error: any) {
    console.error("❌ Failed to notify admins:", error.message);
  }
}
