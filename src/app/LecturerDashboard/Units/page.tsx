"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";
import { usePageTitle } from "../layout";

interface UnitItem {
  id: number;
  unitCode: string;
  unitName: string;
  course: string;
  year: number;
  students: number;
}

const LecturerUnits = () => {
  const { setTitle } = usePageTitle();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle("My Units");
  }, [setTitle]);

  // Dummy data before API connection
  useEffect(() => {
    const timer = setTimeout(() => {
      const dummyUnits: UnitItem[] = [
        {
          id: 1,
          unitCode: "CSC 101",
          unitName: "Intro to Programming",
          course: "BSc IT",
          year: 1,
          students: 45,
        },
        {
          id: 2,
          unitCode: "CSC 204",
          unitName: "Data Structures",
          course: "BSc CS",
          year: 2,
          students: 52,
        },
        {
          id: 3,
          unitCode: "BIT 305",
          unitName: "Database Systems",
          course: "BSc IT",
          year: 3,
          students: 60,
        },
      ];
      setUnits(dummyUnits);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleViewStudents = (unit: UnitItem) => {
    toast.success(`Viewing students for ${unit.unitCode}`);
  };

  const handleUploadMaterials = (unit: UnitItem) => {
    toast(`Uploading materials for ${unit.unitCode}`);
  };

  return (
    <div className="p-6">
      <p className="text-sm text-gray-600 mb-6">
        Units you are teaching this semester. Click an action below each unit.
      </p>

      {loading ? (
        <p className="text-gray-500">Loading units...</p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {units.map((u) => (
            <motion.div
              key={u.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-md p-5 border border-gray-100 transition"
            >
              {/* Header */}
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {u.unitName}
                </h2>
                <p className="text-sm text-gray-500">
                  {u.unitCode} • Year {u.year}
                </p>
              </div>

              {/* Metadata */}
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>
                  <span className="font-medium text-gray-700">Course:</span>{" "}
                  {u.course}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Students:</span>{" "}
                  {u.students}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleViewStudents(u)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#50765F] text-white text-sm font-medium hover:bg-[#446553] transition"
                >
                  <FaUsers /> View
                </button>

                <button
                  onClick={() => handleUploadMaterials(u)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <FaUpload /> Upload
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default LecturerUnits;
