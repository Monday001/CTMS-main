import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

// 🧩 Class structure — now includes lecturerId
interface ClassSlot {
  unitCode: string;
  unitName: string;
  time: string;
  venue: string;
  lec: string;
  lecturerId: string; // ✅ added
  course_name: string;
  remarks?: string;
}

// 🧠 Supports both student and lecturer views
interface TimetableData {
  byYear: {
    [year: string]: {
      [day: string]: {
        [slot: string]: ClassSlot | null;
      };
    };
  };
  byLecturer: {
    [lecturerId: string]: {
      [day: string]: {
        [slot: string]: ClassSlot | null;
      };
    };
  };
}

function mapTimeToSlot(timeStr: string): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":"))
    return "unknown";
  const startHour = parseInt(timeStr.split(":")[0]);
  if (startHour < 10) return "morning";
  if (startHour < 13) return "mid_morning";
  if (startHour < 16) return "evening";
  return "late_evening";
}

function parseTimetableFile(filePath: string): TimetableData {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  const timetable: TimetableData = { byYear: {}, byLecturer: {} };

  // Assuming the Excel structure:
  // Day | Time | Course | Year | Semester | Unit Code | Unit Name | Venue | Lecturer | Lecturer ID
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.length < 10) continue; // ✅ Must include Lecturer ID now

    const day = String(row[0]).trim();
    const time = String(row[1]).trim();
    const course = String(row[2]).trim();
    const yearKey = String(row[3]).trim();

    const unitCode = String(row[5]).trim();
    const unitName = String(row[6]).trim();
    const venue = String(row[7]).trim();
    const lecturer = String(row[8]).trim();
    const lecturerId = String(row[9]).trim(); // ✅ new column

    const slotKey = mapTimeToSlot(time);

    if (!yearKey || !day || !slotKey || !unitName) continue;

    const classDetails: ClassSlot = {
      unitCode,
      unitName,
      time,
      venue,
      lec: lecturer,
      lecturerId,
      course_name: course,
    };

    // 👩‍🎓 By student year
    if (!timetable.byYear[yearKey]) timetable.byYear[yearKey] = {};
    if (!timetable.byYear[yearKey][day]) timetable.byYear[yearKey][day] = {};
    timetable.byYear[yearKey][day][slotKey] = classDetails;

    // 👨‍🏫 By lecturer
    if (lecturerId) {
      if (!timetable.byLecturer[lecturerId]) timetable.byLecturer[lecturerId] = {};
      if (!timetable.byLecturer[lecturerId][day])
        timetable.byLecturer[lecturerId][day] = {};
      timetable.byLecturer[lecturerId][day][slotKey] = classDetails;
    }
  }

  return timetable;
}

export async function GET(req: NextRequest) {
  const filePathParam = req.nextUrl.searchParams.get("path");
  const lecturerId = req.nextUrl.searchParams.get("lecturer_id"); // ✅ optional filter

  if (!filePathParam)
    return NextResponse.json({ error: "Missing file path parameter" }, { status: 400 });

  const absolutePath = path.join(process.cwd(), "public", filePathParam);
  if (!fs.existsSync(absolutePath))
    return NextResponse.json({ error: "Timetable file not found" }, { status: 404 });

  try {
    const parsedData = parseTimetableFile(absolutePath);

    // ✅ Allow lecturer-specific view if `lecturer_id` query param is provided
    if (lecturerId) {
      const lecturerSchedule = parsedData.byLecturer[lecturerId];
      if (!lecturerSchedule)
        return NextResponse.json({ message: "No timetable found for this lecturer" }, { status: 404 });
      return NextResponse.json(lecturerSchedule);
    }

    // Default: return full structured timetable
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("❌ Timetable parsing error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
