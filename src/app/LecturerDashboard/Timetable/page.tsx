"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaMapMarkerAlt, FaBookOpen } from "react-icons/fa";
import { usePageTitle } from "../layout";

const MyTimetable = () => {
  const { setTitle } = usePageTitle();
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Dummy timetable data (used before real data loads)
  const dummyTimetable = [
    {
      day: "Monday",
      unitName: "Computer Networks",
      unitCode: "CSC 201",
      time: "10:00 AM – 12:00 PM",
      venue: "Lab 2",
      course: "BSc Information Technology",
      year: 2,
    },
    {
      day: "Monday",
      unitName: "Data Structures and Algorithms Fundamentals",
      unitCode: "CSC 105",
      time: "2:00 PM – 4:00 PM",
      venue: "Room 3",
      course: "BSc Information Technology",
      year: 1,
    },
    {
      day: "Tuesday",
      unitName: "Database Systems",
      unitCode: "CSC 203",
      time: "8:00 AM – 10:00 AM",
      venue: "Lab 1",
      course: "BSc IT",
      year: 2,
    },
    {
      day: "Wednesday",
      unitName: "Web Development and Internet Programming",
      unitCode: "CSC 205",
      time: "11:00 AM – 1:00 PM",
      venue: "Room 5",
      course: "BSc IT",
      year: 2,
    },
    {
      day: "Thursday",
      unitName: "Operating Systems Concepts and Design",
      unitCode: "CSC 208",
      time: "9:00 AM – 11:00 AM",
      venue: "Lab 4",
      course: "BSc IT",
      year: 2,
    },
  ];

  useEffect(() => {
    setTitle("My Timetable");
  }, [setTitle]);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setSelectedDay(today);
    setTimetable(dummyTimetable); // Temporary data

    const fetchLecturerTimetable = async () => {
      try {
        console.log("📡 Fetching timetable...");
        const res = await fetch("/api/users/timetable/lecturer");
        const result = await res.json();
        console.log("✅ API Response:", result);

        if (res.ok && Array.isArray(result)) {
          setTimetable(result);
        } else {
          console.error("⚠️ Unexpected response:", result);
        }
      } catch (err) {
        console.error("❌ Failed to fetch timetable:", err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchLecturerTimetable();
  }, []);

  const filteredClasses = timetable.filter(
    (cls: any) => cls.day === selectedDay
  );

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 bg-none min-h-screen rounded-xl">
      {/* Subtitle and date */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <p className="text-sm text-gray-600">
          View your scheduled classes for each day of the week.
        </p>
        <p className="text-gray-500 text-sm">{formattedDate}</p>
      </div>

      {/* Day Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-5 py-2.5 rounded-full font-medium text-sm shadow-sm transition-all duration-200 ${
              selectedDay === day
                ? "bg-[#50765F] text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Section */}
      {loading ? (
        <p className="text-gray-500 text-center mt-8">Loading timetable...</p>
      ) : filteredClasses.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 italic text-center mt-8"
        >
          No classes scheduled for {selectedDay}.
        </motion.p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredClasses.map((cls: any, index: number) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg p-5 border border-gray-100 flex flex-col justify-between h-full min-h-[200px]"
              >
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h2 className="text-lg font-semibold text-gray-800 leading-snug break-words whitespace-normal">
                        {cls.unitName}
                      </h2>
                      <span className="text-xs font-semibold bg-[#E3EFE3] text-[#50765F] px-2 py-1 rounded-md whitespace-nowrap">
                        {cls.unitCode}
                      </span>
                    </div>

                    <div className="text-gray-600 text-sm space-y-2 flex-grow">
                      <p className="flex items-center gap-2">
                        <FaClock className="text-[#50765F]" /> {cls.time}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[#50765F]" /> {cls.venue}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaBookOpen className="text-[#50765F]" /> {cls.course} – Year{" "}
                        {cls.year}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default MyTimetable;
