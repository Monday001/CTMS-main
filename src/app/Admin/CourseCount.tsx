"use client";

import React, { useEffect, useState, useRef } from "react";
import Typography from "@mui/material/Typography";
import { FaClipboardList } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

export default function CourseCount() {
  const [courseCount, setCourseCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const previousCount = useRef(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // ✅ Smooth animated count transition
  const animateCount = (target: number) => {
    const duration = 700;
    const start = displayedCount;
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedCount(Math.floor(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  // ✅ Fetch current course count
  const fetchCourseCount = async () => {
    try {
      const res = await axios.get("/api/users/courses");
      if (res.data?.success) {
        const count = res.data.courses?.length || 0;
        setCourseCount(count);
        animateCount(count);

        // ✅ Notify if new course added
        if (count > previousCount.current && previousCount.current !== 0) {
          toast.success("A new course has been added!");
        }

        previousCount.current = count;
      } else {
        setCourseCount(0);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  // ✅ Polling logic
  useEffect(() => {
    // Initial fetch
    fetchCourseCount();

    // Poll every 10 seconds (adjustable)
    pollingInterval.current = setInterval(fetchCourseCount, 10000);

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-start">
      <button className="bg-none p-2 rounded-lg flex items-center">
        <FaClipboardList className="relative text-lg ml-1 mr-1 text-[#50765F]" />
        <span className="ml-2 text-base">Courses</span>
      </button>

      <Typography
        component="div"
        variant="h4"
        sx={{ display: "flex", alignItems: "center", p: 1, ml: 4 }}
      >
        <span className="font-semibold text-stone-700 text-2xl">
          {displayedCount}
        </span>
      </Typography>
    </div>
  );
}
