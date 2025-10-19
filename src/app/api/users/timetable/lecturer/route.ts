import { NextRequest, NextResponse } from "next/server";
import pool from "@/dbConfig/dbConfig";
import { verifyToken } from "@/lib/auth";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

interface LecturerSlot {
  day: string;
  time: string;
  course: string;
  year: string;
  semester: string;
  unitCode: string;
  unitName: string;
  venue: string;
  lecturer: string;
  lecturerId: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log("📥 Incoming request to /api/users/timetable/lecturer");

    // 1️⃣ Verify Token
    const { valid, user, response } = verifyToken(req);
    if (!valid) {
      console.log("❌ Invalid or missing token");
      return response;
    }

    const currentUser = user as any;
    console.log("👤 Current user:", currentUser);

    if (currentUser.role !== "LECTURER") {
      console.log("🚫 Unauthorized role:", currentUser.role);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2️⃣ Fetch lecturer employeeNumber
    const [lecturerRows]: any = await pool.query(
      "SELECT employeeNumber FROM lecturer WHERE userId = ?",
      [currentUser.id]
    );

    if (lecturerRows.length === 0) {
      console.log("⚠️ Lecturer not found for userId:", currentUser.id);
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    const lecturerId = lecturerRows[0].employeeNumber;
    console.log("🆔 Lecturer ID (from DB):", lecturerId);

    // 3️⃣ Get timetable file
    const [timetableRows]: any = await pool.query(
      "SELECT filePath FROM timetable WHERE status = 'current' ORDER BY createdAt DESC LIMIT 1"
    );

    if (timetableRows.length === 0) {
      console.log("⚠️ No current timetable found");
      return NextResponse.json({ error: "No current timetable available" }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), "public", timetableRows[0].filePath);
    console.log("📂 Reading Excel file:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("❌ Timetable file not found on disk");
      return NextResponse.json({ error: "Timetable file not found" }, { status: 404 });
    }

    // 4️⃣ Parse Excel and log sample data
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    console.log("📊 Total rows read:", rows.length);
    console.log("🧾 Header row:", rows[0]);

    const lecturerTimetable: LecturerSlot[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 10) continue;

      const [day, time, course, year, semester, unitCode, unitName, venue, lecturer, lecturerIdCell] = row;

      if (String(lecturerIdCell).trim() === String(lecturerId).trim()) {
        console.log(`✅ Match found for ${lecturerId} at row ${i + 1}`);
        lecturerTimetable.push({
          day: String(day).trim(),
          time: String(time).trim(),
          course: String(course).trim(),
          year: String(year).trim(),
          semester: String(semester).trim(),
          unitCode: String(unitCode).trim(),
          unitName: String(unitName).trim(),
          venue: String(venue).trim(),
          lecturer: String(lecturer).trim(),
          lecturerId: String(lecturerIdCell).trim(),
        });
      }
    }

    console.log("📤 Timetable rows matched:", lecturerTimetable.length);
    if (lecturerTimetable.length > 0) {
      console.log("🔍 Sample matched row:", lecturerTimetable[0]);
    }

    return NextResponse.json(lecturerTimetable);
  } catch (error: any) {
    console.error("❌ Lecturer timetable fetch failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
