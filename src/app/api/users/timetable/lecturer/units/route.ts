import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import * as XLSX from "xlsx";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface TimetableRow {
  Day?: string;
  Time?: string;
  Course?: string;
  Year?: string | number;
  Semester?: string | number;
  "Unit Code"?: string;
  "Unit Name"?: string;
  Venue?: string;
  Lecturer?: string;
  "Lecturer ID"?: string;
  [key: string]: any;
}

const normalize = (str: any) =>
  str?.toString().trim().replace(/\s+/g, " ").toUpperCase() || "";

const safeInt = (val: any) => {
  const n = parseInt(val);
  return isNaN(n) ? null : n;
};

export async function GET(req: NextRequest) {
  try {
    // ✅ 1. Verify JWT
    const { valid, user, response } = verifyToken(req);
    if (!valid) return response;

    const lecturerUser = user as any;
    if (lecturerUser.role !== "LECTURER") {
      console.warn("🚫 Unauthorized access attempt by:", lecturerUser.email);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log(`👨‍🏫 Lecturer Authenticated: ${lecturerUser.email}`);

    // ✅ 2. Fetch lecturer employee number
    const [lectRows]: any = await pool.query(
      "SELECT employeeNumber FROM lecturer WHERE userId = ? LIMIT 1",
      [lecturerUser.id]
    );

    if (!lectRows?.length) {
      console.error(`❌ No lecturer record found for userId ${lecturerUser.id}`);
      return NextResponse.json([], { status: 200 });
    }

    const employeeNumber = normalize(lectRows[0].employeeNumber);
    console.log(`🆔 Lecturer Employee Number: ${employeeNumber}`);

    // ✅ 3. Get active timetable file
    const [rows]: any = await pool.query(
      "SELECT filePath FROM timetable WHERE status = 'current' ORDER BY createdAt DESC LIMIT 1"
    );

    if (!rows?.length) {
      console.error("❌ No active timetable found in DB");
      return NextResponse.json([], { status: 200 });
    }

    let dbFilePath = rows[0].filePath;
    if (dbFilePath.startsWith("/")) dbFilePath = dbFilePath.slice(1);
    if (dbFilePath.startsWith("public/")) dbFilePath = dbFilePath.slice("public/".length);

    const timetablePath = path.join(process.cwd(), "public", dbFilePath);
    console.log(`🧭 Resolved timetable path: ${timetablePath}`);

    if (!fsSync.existsSync(timetablePath)) {
      console.error("❌ Timetable file missing:", timetablePath);
      return NextResponse.json([], { status: 200 });
    }

    const stats = fsSync.statSync(timetablePath);
    if (stats.size === 0) {
      console.error("❌ Timetable file is empty");
      return NextResponse.json([], { status: 200 });
    }

    // ✅ 4. Parse Excel file
    const buffer = await fs.readFile(timetablePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      console.error("❌ No sheet found in Excel file");
      return NextResponse.json([], { status: 200 });
    }

    const rowsData = XLSX.utils.sheet_to_json<TimetableRow>(sheet);
    console.log(`📘 Loaded ${rowsData.length} rows from '${sheetName}'`);

    // ✅ 5. Filter only lecturer’s units
    const lecturerFullName = normalize(`${lecturerUser.firstname} ${lecturerUser.lastname}`);
    const lecturerUnits = rowsData.filter((row) => {
      const excelLecturerID = normalize(row["Lecturer ID"]);
      const excelLecturerName = normalize(row["Lecturer"]);
      return excelLecturerID === employeeNumber || excelLecturerName === lecturerFullName;
    });

    console.log(`✅ Found ${lecturerUnits.length} timetable rows for lecturer`);

    // ✅ 6. Group units (ignore duplicates for same Unit Code + Name)
    const grouped: Record<string, any> = {};

    for (const row of lecturerUnits) {
      const unitCode = normalize(row["Unit Code"]);
      const unitName = normalize(row["Unit Name"]);

      if (!unitCode && !unitName) continue;

      const key = `${unitCode}_${unitName}`;
      if (!grouped[key]) {
        grouped[key] = {
          unitCode: row["Unit Code"] || "",
          unitName: row["Unit Name"] || "",
          course: row.Course || "",
          year: safeInt(row.Year),
          semester: safeInt(row.Semester),
          lecturer: row.Lecturer || "",
          lecturerID: row["Lecturer ID"] || "",
          sessions: [],
          studentCount: 0,
          studentList: [],
        };
      }

      grouped[key].sessions.push({
        day: row.Day || "",
        time: row.Time || "",
        venue: row.Venue || "",
      });
    }

    // ✅ 7. Fetch student details for each course/year
    for (const key of Object.keys(grouped)) {
      const unit = grouped[key];
      const course = normalize(unit.course);
      const year = unit.year;

      if (!course || !year) {
        console.warn(`⚠️ Skipping student lookup for ${unit.unitCode} (${unit.course}, ${unit.year})`);
        continue;
      }

      try {
        const [studentRows]: any = await pool.query(
          `SELECT s.id, s.registrationNumber, u.firstname, u.lastname, u.email, s.course, s.yearOfStudy
           FROM student s 
           JOIN users u ON u.id = s.id
           WHERE UPPER(s.course) = ? AND s.yearOfStudy = ?`,
          [course, year]
        );

        unit.studentCount = studentRows.length;
        unit.studentList = studentRows.map((s: any) => ({
          id: s.id,
          firstName: s.firstname,
          lastName: s.lastname,
          registrationNumber: s.registrationNumber,
          email: s.email,
        }));

        console.log(`👥 ${unit.unitCode}: ${unit.studentCount} students (${unit.course} - Year ${unit.year})`);
      } catch (err: any) {
        console.error(`💥 Error fetching students for ${key}:`, err.message);
      }
    }

    // ✅ 8. Prepare clean response
    const finalUnits = Object.values(grouped).map((u: any) => ({
      ...u,
      students: u.studentCount,          // numeric count
      studentList: u.studentList || [],  // array of student details
    }));

    console.log(`📚 Returning ${finalUnits.length} unique units`);
    return NextResponse.json(finalUnits, { status: 200 });

  } catch (err: any) {
    console.error("💥 Fatal error in /api/users/timetable/lecturer/units:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
