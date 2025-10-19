"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// helper for color intensity like GitHub commits
function getColor(value: number) {
  if (value > 80) return "#2e7d32"; // dark green
  if (value > 60) return "#66bb6a";
  if (value > 40) return "#a5d6a7";
  if (value > 20) return "#dcedc8";
  return "#f1f8e9";
}

interface CourseData {
  course: string;
  year1: number;
  year2: number;
  year3: number;
  year4: number;
}

// ✅ initial dummy data (visible immediately)
const dummyData: CourseData[] = [
  { course: "Computer Science", year1: 80, year2: 65, year3: 50, year4: 45 },
  { course: "Information Technology", year1: 60, year2: 70, year3: 55, year4: 40 },
  { course: "Business Management", year1: 90, year2: 85, year3: 80, year4: 75 },
  { course: "Accounting", year1: 75, year2: 70, year3: 60, year4: 55 },
  { course: "Economics", year1: 50, year2: 45, year3: 40, year4: 35 },
];

export default function CourseDistributionGraph() {
  const [data, setData] = useState<CourseData[]>(dummyData);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch API data & smoothly update the grid
  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const res = await axios.get("/api/users/courseDistribution");
        const apiData = res.data?.data;

        // transform [{ course, year, count }] → grouped by course
        const grouped: Record<string, any> = {};
        apiData.forEach((item: any) => {
          if (!grouped[item.course]) {
            grouped[item.course] = {
              course: item.course,
              year1: 0,
              year2: 0,
              year3: 0,
              year4: 0,
            };
          }
          grouped[item.course][`year${item.year}`] = item.count;
        });

        // ✅ smooth transition by gradually blending data
        setTimeout(() => {
          setData(Object.values(grouped));
          setLoading(false);
        }, 800); // slight delay to make the fade smooth
      } catch (error) {
        console.error("Error fetching distribution:", error);
        setLoading(false);
      }
    };

    fetchDistribution();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h2 className="text-xl font-semibold text-[#50765F] mb-4">
        Course Distribution by Year
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-sm font-semibold text-gray-600 p-2">Course</th>
              <th className="text-center text-sm font-semibold text-gray-600 p-2">Year 1</th>
              <th className="text-center text-sm font-semibold text-gray-600 p-2">Year 2</th>
              <th className="text-center text-sm font-semibold text-gray-600 p-2">Year 3</th>
              <th className="text-center text-sm font-semibold text-gray-600 p-2">Year 4</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-gray-200">
                <td className="text-sm font-medium text-gray-700 p-2">{row.course}</td>
                {[row.year1, row.year2, row.year3, row.year4].map((val, j) => (
                  <td key={j} className="p-2 text-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${i}-${j}-${val}`}
                        initial={{ opacity: 0.3, scale: 0.6 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          backgroundColor: getColor(val),
                        }}
                        transition={{
                          duration: 0.6,
                          ease: "easeInOut",
                        }}
                        className="mx-auto w-6 h-6 rounded-sm border border-gray-200"
                        title={`${val} students`}
                      />
                    </AnimatePresence>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-[#f1f8e9] border border-gray-200"></span> 0–20
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-[#dcedc8] border border-gray-200"></span> 21–40
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-[#a5d6a7] border border-gray-200"></span> 41–60
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-[#66bb6a] border border-gray-200"></span> 61–80
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-sm bg-[#2e7d32] border border-gray-200"></span> 81–100
        </div>
      </div>
    </div>
  );
}
