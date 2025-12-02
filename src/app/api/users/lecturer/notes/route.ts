import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import * as XLSX from "xlsx";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*                                Types & Helpers                             */
/* -------------------------------------------------------------------------- */
interface TimetableRow {
  "Lecturer ID"?: string;
  "Unit Code"?: string;
  "Course"?: string;
  "Year"?: string | number;
  [key: string]: any;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];

const normalize = (str?: string | number | null): string =>
  str?.toString().trim().replace(/\s+/g, " ").toUpperCase() || "";

/* -------------------------------------------------------------------------- */
/*                            POST: Upload Lecturer Notes                     */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const lecturer = user as any;
    if (lecturer.role !== "LECTURER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Extract query & form data
    const url = new URL(req.url);
    const unitCodeQuery = url.searchParams.get("unitCode");
    const formData = await req.formData();

    const file = (formData.get("file") || formData.get("filepond")) as File | null;
    const title = (formData.get("title") as string) || "";
    const unitCodeForm = (formData.get("unitCode") as string) || "";
    const visible =
      formData.get("visibleToStudents") === "true" ||
      formData.get("visibleToStudents") === "1";

    const unitCodeRaw = unitCodeQuery || unitCodeForm;
    if (!file || !title || !unitCodeRaw)
      return NextResponse.json({ error: "Missing title, file, or unit code" }, { status: 400 });

    const unitCode = normalize(unitCodeRaw);

    // ✅ Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.type))
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

    // ✅ Save uploaded file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "notes");
    if (!fsSync.existsSync(uploadDir)) await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${uuidv4()}${ext}`;
    const absPath = path.join(uploadDir, fileName);
    const filePath = `/uploads/notes/${fileName}`;
    await fs.writeFile(absPath, Buffer.from(await file.arrayBuffer()));

    console.log(`📁 File saved to ${filePath}`);

    // ✅ Get lecturer employeeNumber
    const [lectRows]: any = await pool.query(
      "SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1",
      [lecturer.id]
    );

    if (!lectRows?.length) {
      console.error(`❌ No lecturer record found for userId ${lecturer.id}`);
      return NextResponse.json({ error: "Lecturer record not found" }, { status: 404 });
    }

    const employeeNumber = normalize(lectRows[0].employeeNumber);
    const lecturerFullName = normalize(`${lecturer.firstname} ${lecturer.lastname}`);

    // ✅ Verify lecturer teaches this unit
    const [rows]: any = await pool.query(
      "SELECT filePath FROM timetable WHERE status = 'current' ORDER BY createdAt DESC LIMIT 1"
    );

    if (!rows?.length)
      return NextResponse.json({ error: "No current timetable found" }, { status: 404 });

    let dbFilePath = rows[0].filePath;
    if (dbFilePath.startsWith("/")) dbFilePath = dbFilePath.slice(1);
    if (dbFilePath.startsWith("public/")) dbFilePath = dbFilePath.slice("public/".length);

    const timetablePath = path.join(process.cwd(), "public", dbFilePath);
    if (!fsSync.existsSync(timetablePath))
      return NextResponse.json({ error: "Timetable file missing on server" }, { status: 404 });

    const buffer = await fs.readFile(timetablePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json<TimetableRow>(workbook.Sheets[sheetName]);

    console.log("🔍 Checking assignment:", { employeeNumber, unitCode });

    const lecturerUnit = data.find(
      (row) =>
        (normalize(row["Lecturer ID"]) === employeeNumber ||
          normalize(row["Lecturer"]) === lecturerFullName) &&
        normalize(row["Unit Code"]) === unitCode
    );

    if (!lecturerUnit) {
      console.warn(`❌ Lecturer ${employeeNumber} not assigned to ${unitCode}`);
      return NextResponse.json(
        { error: "This lecturer is not assigned to the provided unit code." },
        { status: 404 }
      );
    }

    const course = lecturerUnit["Course"];
    const year = lecturerUnit["Year"];

    // ✅ Save uploaded note record
    await pool.query(
      `INSERT INTO unit_notes 
       (lecturer_id, unit_code, title, file_path, visible_to_students, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [employeeNumber, unitCodeRaw, title, filePath, visible ? 1 : 0]
    );

    console.log(`✅ Note uploaded: ${title} (${unitCodeRaw}) by ${employeeNumber}`);

    // ✅ Create & send notification
    if (course && year) {
      const [students]: any = await pool.query(
        `SELECT u.id 
           FROM student s 
           JOIN users u ON s.id = u.id 
          WHERE s.course = ? AND s.yearOfStudy = ?`,
        [course, year]
      );

      if (students.length > 0) {
        // 🧱 Step 1: Insert main notification record
        const [notifResult]: any = await pool.query(
          `INSERT INTO notification (senderId, title, message, unitCode, type)
           VALUES (?, ?, ?, ?, ?)`,
          [
            lecturer.id,
            `New Notes Uploaded - ${unitCodeRaw}`,
            `New notes uploaded for ${unitCodeRaw}: ${title}`,
            unitCodeRaw,
            "note_upload",
          ]
        );

        const notificationId = notifResult.insertId;

        // 🧩 Step 2: Create records for each student
        const values = students.map((s: any) => [notificationId, s.id, 0, 0]);
        await pool.query(
          `INSERT INTO notification_user (notificationId, userId, readStatus, deleted)
           VALUES ?`,
          [values]
        );

        console.log(`📢 Notified ${students.length} students of ${course} (Year ${year})`);
      } else {
        console.warn(`⚠️ No students found for ${course} Year ${year}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notes uploaded successfully",
      data: {
        title,
        unitCode: unitCodeRaw,
        filePath,
        course,
        year,
        visibleToStudents: visible,
      },
    });
  } catch (err: any) {
    console.error("❌ POST notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*                             GET: Fetch Lecturer Notes                      */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const lecturer = user as any;
    if (lecturer.role !== "LECTURER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // ✅ Fetch correct lecturer ID
    const [lectRows]: any = await pool.query(
      "SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1",
      [lecturer.id]
    );
    if (!lectRows?.length)
      return NextResponse.json({ error: "Lecturer record not found" }, { status: 404 });

    const employeeNumber = normalize(lectRows[0].employeeNumber);

    const url = new URL(req.url);
    const unitCode = url.searchParams.get("unitCode");

    let query = `
      SELECT id, title, unit_code AS unitCode, file_path AS filePath, 
             visible_to_students AS visibleToStudents, created_at AS uploadedAt
      FROM unit_notes 
      WHERE lecturer_id = ?
    `;
    const params: any[] = [employeeNumber];

    if (unitCode) {
      query += " AND unit_code = ?";
      params.push(unitCode);
    }

    query += " ORDER BY created_at DESC";
    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, notes: rows });
  } catch (err: any) {
    console.error("❌ GET notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/*                           PATCH: Toggle Visibility                         */
/* -------------------------------------------------------------------------- */
export async function PATCH(req: NextRequest) {
  try {
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const lecturer = user as any;
    if (lecturer.role !== "LECTURER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { noteId, visible } = await req.json();
    if (!noteId || typeof visible === "undefined")
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    // ✅ Fetch lecturer employeeNumber
    const [lectRows]: any = await pool.query(
      "SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1",
      [lecturer.id]
    );
    if (!lectRows?.length)
      return NextResponse.json({ error: "Lecturer record not found" }, { status: 404 });

    const employeeNumber = normalize(lectRows[0].employeeNumber);

    await pool.query(
      `UPDATE unit_notes 
       SET visible_to_students = ? 
       WHERE id = ? AND lecturer_id = ?`,
      [visible ? 1 : 0, noteId, employeeNumber]
    );

    console.log(
      `👁️ Note ${noteId} by ${employeeNumber} set to ${visible ? "visible" : "hidden"}`
    );

    return NextResponse.json({ success: true, message: "Visibility updated" });
  } catch (err: any) {
    console.error("❌ PATCH visibility error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
