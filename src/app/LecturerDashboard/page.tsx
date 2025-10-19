"use client";

import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import axios from "axios";
import toast from "react-hot-toast";
import { FaClock, FaBookOpen, FaBell, FaChalkboardTeacher } from "react-icons/fa";
import { usePageTitle } from "./layout";

const defaultTheme = createTheme();

interface LecturerData {
  firstname?: string;
  lastname?: string;
  email?: string;
}

interface TimetableRow {
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

export default function LecturerDashboard() {
  const { setTitle } = usePageTitle();
  const [lecturerName, setLecturerName] = React.useState("Lecturer");
  const [timetable, setTimetable] = React.useState<TimetableRow[]>([]);
  const [todayClasses, setTodayClasses] = React.useState<TimetableRow[]>([]);
  const [nextClassTime, setNextClassTime] = React.useState("Calculating...");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 16) return "Good afternoon";
    return "Good evening";
  };

  React.useEffect(() => {
    setTitle("Dashboard");

    const fetchLecturer = async () => {
      try {
        const res = await axios.get("/api/users/me");
        const data: LecturerData = res.data?.data;
        console.log("👤 Lecturer API response:", res.data);
        if (data?.firstname) setLecturerName(data.firstname.split(" ")[0]);
      } catch (err) {
        console.error("❌ Failed to load lecturer data:", err);
        toast.error("Failed to load lecturer data.");
      }
    };

    const fetchTimetable = async () => {
      try {
        console.log("📡 Fetching lecturer timetable...");
        const res = await axios.get("/api/users/timetable/lecturer");
        console.log("📦 Raw timetable API response:", res.data);

        // Detect data format
        let rows: TimetableRow[] = [];
        if (Array.isArray(res.data)) {
          rows = res.data;
        } else if (Array.isArray(res.data.data)) {
          rows = res.data.data;
        } else {
          console.warn("⚠️ Unexpected timetable response shape:", res.data);
        }

        console.log("🧩 Extracted timetable rows:", rows);

        // Normalize day/time fields
        const normalizedRows = rows.map((r, i) => ({
          ...r,
          day: r.day?.trim(),
          time: r.time?.trim().replace("–", "-").replace("—", "-"),
        }));

        console.log("📚 Normalized rows:", normalizedRows.map((r, i) => `${i + 1}. ${r.day} → ${r.time}`));

        setTimetable(normalizedRows);

        // Determine today’s name
        const todayName = new Date().toLocaleString("en-US", { weekday: "long" });
        console.log("🗓️ Today is:", todayName);

        // Filter today's classes
        const todayRows = normalizedRows.filter(
          (r) => r.day?.trim().toLowerCase() === todayName.trim().toLowerCase()
        );

        console.log("✅ Matching classes for today:", todayRows);
        setTodayClasses(todayRows);
      } catch (err) {
        console.error("❌ Failed to fetch timetable:", err);
        toast.error("Failed to fetch timetable.");
      }
    };

    fetchLecturer();
    fetchTimetable();
  }, [setTitle]);

  // === Helper Functions ===

  const getDayIndex = (day: string): number => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const idx = days.findIndex((d) => d.toLowerCase() === day.toLowerCase());
    console.log(`📅 getDayIndex("${day}") →`, idx);
    return idx;
  };

  const parseStartTime = (timeRange: string): string => {
    if (!timeRange) return "";
    const cleanRange = timeRange.replace("–", "-").replace("—", "-");
    const [start] = cleanRange.split("-").map((t) => t.trim());
    console.log(`⏰ parseStartTime("${timeRange}") → ${start}`);
    return start;
  };

  const parseTo24Hour = (time: string): { hours: number; minutes: number } => {
    if (!time) return { hours: 0, minutes: 0 };
    const ampmMatch = time.match(/(am|pm)/i);
    let [hoursStr, minutesStr = "0"] = time.replace(/(am|pm)/i, "").trim().split(":");
    let hours = parseInt(hoursStr, 10);
    let minutes = parseInt(minutesStr, 10) || 0;

    if (ampmMatch) {
      const isPM = ampmMatch[0].toLowerCase() === "pm";
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }

    if (!ampmMatch && hours >= 0 && hours <= 23) {
      console.log(`🕐 parseTo24Hour("${time}") → ${hours}:${minutes}`);
      return { hours, minutes };
    }

    console.warn(`⚠️ parseTo24Hour could not parse "${time}"`);
    return { hours: 0, minutes: 0 };
  };

  const findNextClassDateTime = (rows: TimetableRow[]): Date | null => {
    if (!rows.length) {
      console.log("🚫 No timetable rows provided to findNextClassDateTime.");
      return null;
    }

    const now = new Date();
    let soonest: Date | null = null;

    for (const row of rows) {
      const dayIdx = getDayIndex(row.day);
      if (dayIdx < 0) {
        console.warn("⚠️ Invalid day in row:", row.day);
        continue;
      }

      const startTime = parseStartTime(row.time);
      const { hours, minutes } = parseTo24Hour(startTime);

      const classDate = new Date(now);
      const dayDiff = (dayIdx - now.getDay() + 7) % 7;
      classDate.setDate(now.getDate() + dayDiff);
      classDate.setHours(hours, minutes, 0, 0);

      if (classDate <= now) classDate.setDate(classDate.getDate() + 7);

      console.log(`📘 Checking class "${row.unitCode}" on ${row.day} ${startTime} →`, classDate);

      if (!soonest || classDate < soonest) soonest = classDate;
    }

    console.log("📆 Soonest next class →", soonest?.toLocaleString());
    return soonest;
  };

  const formatTimeDiff = (ms: number): string => {
    if (ms <= 0) return "Class starting now 🚀";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // === Countdown Logic ===
  React.useEffect(() => {
    if (!timetable.length) {
      console.log("⏳ Countdown skipped — timetable empty.");
      return;
    }

    const updateCountdown = () => {
      console.log("🔁 Updating countdown...");
      const nextClass = findNextClassDateTime(timetable);
      if (!nextClass) {
        setNextClassTime("No upcoming class 🎉");
        return;
      }

      const now = new Date();
      const diff = nextClass.getTime() - now.getTime();
      console.log("⏱️ Countdown diff (ms):", diff);
      setNextClassTime(formatTimeDiff(diff));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [timetable]);

  const totalUnits = React.useMemo(() => {
    const unique = new Set(timetable.map((cls) => cls.unitCode)).size;
    console.log("📊 Total unique units:", unique);
    return unique;
  }, [timetable]);

  const summary = [
    { icon: <FaClock />, title: "Next Class in", value: nextClassTime },
    { icon: <FaBookOpen />, title: "Total Units", value: totalUnits },
    { icon: <FaChalkboardTeacher />, title: "Today’s Classes", value: todayClasses.length },
    { icon: <FaBell />, title: "Unread Notifications", value: 3 },
  ];

  const todayName = new Date().toLocaleString("en-US", { weekday: "long" });
  const isWeekend = todayName === "Saturday" || todayName === "Sunday";

  // === UI ===
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }} className="w-full bg-white">
        <CssBaseline />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            p: 3,
          }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#50765F]">
              {getGreeting()}, {lecturerName} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back to your teaching dashboard.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary.map((item, index) => (
              <div
                key={index}
                className="p-5 bg-[#D0DCD0] shadow rounded-xl flex items-center space-x-4 hover:shadow-md transition"
              >
                <div className="text-[#50765F] text-2xl">{item.icon}</div>
                <div>
                  <p className="text-sm text-gray-600">{item.title}</p>
                  <p className="text-lg font-bold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Today’s Schedule */}
          <div className="mt-8 bg-white p-5 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Today’s Schedule</h2>
            {isWeekend ? (
              <p className="text-gray-500">It’s a weekend — no classes today 🎉</p>
            ) : todayClasses.length === 0 ? (
              <p className="text-gray-500">No classes scheduled for today.</p>
            ) : (
              <ul className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <li key={index} className="flex justify-between text-gray-700 border-b pb-2">
                    <span>
                      {cls.unitCode} - {cls.unitName}
                    </span>
                    <span>
                      {cls.time} ({cls.venue})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
