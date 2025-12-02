"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaUpload, FaFileAlt, FaTimes, FaEye, FaDownload } from "react-icons/fa";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import axios from "axios";
import { useRouter } from "next/navigation";
import { usePageTitle } from "../layout";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  email: string;
}

interface UnitItem {
  id: number;
  unitCode: string;
  unitName: string;
  course: string;
  year: number;
  students: number;
  studentList: Student[];
  notes: {
    title: string;
    filePath: string;
    uploadedAt: string;
  }[];
}

const LecturerUnits = () => {
  const { setTitle } = usePageTitle();
  const router = useRouter();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [viewModal, setViewModal] = useState<{ title: string; filePath: string } | null>(null);
  const [lecturerName, setLecturerName] = useState("Lecturer");
  const [studentsModal, setStudentsModal] = useState(false);

  useEffect(() => {
    setTitle("My Units");
  }, [setTitle]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get("/api/users/me");
        const lecturer = userRes.data?.data;
        if (lecturer?.firstname || lecturer?.lastname) {
          setLecturerName(`${lecturer.firstname} ${lecturer.lastname}`);
        }

        const res = await axios.get("/api/users/timetable/lecturer/units");
        const data = res.data;

        if (Array.isArray(data)) {
          const formatted = data.map((u: any, i: number) => ({
            id: i + 1,
            unitCode: u.unitCode,
            unitName: u.unitName,
            course: u.course,
            year: parseInt(u.year),
            students: u.students || 0,
            studentList: Array.isArray(u.studentList) ? u.studentList : [],
            notes: Array.isArray(u.notes) ? u.notes : [],
          }));
          setUnits(formatted);
        } else {
          toast.error("Unexpected API response format");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load lecturer data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDownload = () => {
    if (!selectedUnit) return;
    const now = new Date();
    const generatedDate = now.toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const headerInfo = [
      [`Lecturer: ${lecturerName}`],
      [`Unit: ${selectedUnit.unitCode} - ${selectedUnit.unitName}`],
      [`Generated on: ${generatedDate}`],
      [],
    ];

    const tableHeader = [["No.", "Name", "Registration Number", "Email"]];
    const tableData = selectedUnit.studentList.map((s, index) => [
      index + 1,
      `${s.firstName} ${s.lastName}`,
      s.registrationNumber,
      s.email,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([...headerInfo, ...tableHeader, ...tableData]);
    worksheet["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, "Student List");
    const safeName = lecturerName.replace(/\s+/g, "_");
    XLSX.writeFile(wb, `${selectedUnit.unitCode}_${safeName}.xlsx`);
  };

  // ✅ Navigate to Notes page instead of showing modal
  const handleUploadMaterials = (unit: UnitItem) => {
    router.push(`/LecturerDashboard/Notes?unitCode=${unit.unitCode}&unitName=${encodeURIComponent(unit.unitName)}`);
  };

  return (
    <div className="p-6">
      <p className="text-sm text-gray-600 mb-6">
        Units you are teaching this semester. Click “Students” to view enrolled students or upload/view notes.
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
              className="bg-white rounded-xl shadow-md p-5 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{u.unitName}</h2>
              <p className="text-sm text-gray-500 mb-3">
                {u.unitCode} • Year {u.year}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Course:</strong> {u.course}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Students:</strong> {u.students}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedUnit(u);
                    setStudentsModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#50765F] text-white text-sm font-medium hover:bg-[#446553]"
                >
                  <FaUsers /> Students
                </button>

                {u.notes.length > 0 ? (
                  <button
                    onClick={() =>
                      setViewModal({
                        title: u.notes[u.notes.length - 1].title,
                        filePath: u.notes[u.notes.length - 1].filePath,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <FaEye /> View Notes
                  </button>
                ) : (
                  <button
                    onClick={() => handleUploadMaterials(u)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <FaUpload /> Upload
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ✅ Students Modal */}
      {studentsModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative shadow-lg">
            <FaTimes
              className="absolute top-4 right-4 text-gray-600 cursor-pointer"
              onClick={() => {
                setStudentsModal(false);
                setSelectedUnit(null);
              }}
            />
            <h2 className="text-lg font-semibold text-[#50765F] mb-3">
              Students Enrolled in {selectedUnit.unitCode} - {selectedUnit.unitName}
            </h2>

            {selectedUnit.studentList.length > 0 ? (
              <>
                <table className="w-full border border-gray-200 text-sm mb-4">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border">No.</th>
                      <th className="px-3 py-2 border text-left">Name</th>
                      <th className="px-3 py-2 border text-left">Reg. Number</th>
                      <th className="px-3 py-2 border text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUnit.studentList.map((s, index) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="border px-3 py-2 text-center">{index + 1}</td>
                        <td className="border px-3 py-2">{s.firstName} {s.lastName}</td>
                        <td className="border px-3 py-2">{s.registrationNumber}</td>
                        <td className="border px-3 py-2">{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#50765F] text-white text-sm font-medium hover:bg-[#446553]"
                >
                  <FaDownload /> Download List
                </button>
              </>
            ) : (
              <p className="text-gray-500">No students enrolled yet.</p>
            )}
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
            <FaTimes
              className="absolute top-4 right-4 text-gray-600 cursor-pointer"
              onClick={() => setViewModal(null)}
            />
            <h2 className="text-lg font-semibold text-[#50765F] mb-3">{viewModal.title}</h2>
            <iframe src={viewModal.filePath} className="w-full h-[500px] border rounded" title={viewModal.title} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerUnits;
