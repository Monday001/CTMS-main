"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { FaArrowLeft, FaExpand, FaCompress, FaDownload, FaBook } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface TimetableSlot {
  unitCode: string;
  unitName: string;
  time: string;
  venue: string;
  lec: string;
  [key: string]: any;
}

interface Note {
  id: number;
  title: string;
  unitCode: string;
  filePath: string;
  visibleToStudents: number;
  uploadedAt: string;
}

export default function NotesPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<TimetableSlot[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<TimetableSlot | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalFile, setModalFile] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [userCourse, setUserCourse] = useState("");
  const [userYear, setUserYear] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  /* ----------------------------- Load User & Timetable ----------------------------- */
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);

        // Load user
        const resUser = await axios.get("/api/users/me");
        const user = resUser.data.data;
        setUserCourse(user.course);
        setUserYear(String(user.yearOfStudy));

        // Load timetable
        const fileRes = await fetch("/api/users/timetable?type=current");
        const fileJson = await fileRes.json();
        if (!fileJson.filePath) return toast.error("No timetable found.");

        const parseRes = await fetch(`/api/users/timetable/parser?path=${fileJson.filePath}`);
        const parsed = await parseRes.json();
        const byYear = parsed.byYear?.[user.yearOfStudy];
        if (!byYear) return toast.error("No timetable for your year.");

        // Filter by course and collect unique units
        const unitMap: Record<string, TimetableSlot> = {};
        Object.keys(byYear).forEach((day) => {
          Object.values(byYear[day]).forEach((slot: any) => {
            if (slot.course_name === user.course && !unitMap[slot.unitCode]) {
              unitMap[slot.unitCode] = slot;
            }
          });
        });

        const unitList = Object.values(unitMap);
        setUnits(unitList);

        if (unitList.length) {
          setSelectedUnit(unitList[0]);
          fetchNotes(unitList[0].unitCode);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load notes data.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /* ----------------------------- Fetch Notes ----------------------------- */
  const fetchNotes = async (unitCode: string) => {
    try {
      setLoadingNotes(true);
      const res = await axios.get(`/api/users/student/notes?unitCode=${unitCode}`);
      if (res.data.success) setNotes(res.data.notes);
      else setNotes([]);
    } catch (err) {
      console.error(err);
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const openModal = (file: string) => {
    setModalFile(file);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalFile(null);
    setIsFullscreen(false);
  };

  const renderFileContent = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (!ext) return <p>Cannot preview this file.</p>;

    switch (ext) {
      case "pdf":
        return <iframe src={url} className="w-full h-full" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <img src={url} className="w-full h-full object-contain" />;
      case "mp4":
        return <video src={url} controls className="w-full h-full" />;
      case "mp3":
        return <audio src={url} controls className="w-full" />;
      default:
        return <p className="text-center mt-10">Preview not available. Please download.</p>;
    }
  };

  return (
    <main className="flex w-full h-screen bg-white">
      {/* Units Sidebar */}
      <aside className="w-64 bg-[#50765F] text-white flex-shrink-0 p-6 flex flex-col">
        <button
          onClick={() => router.push("/Student")}
          className="flex items-center mb-6 font-semibold hover:text-gray-200"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <FaBook className="mr-2" /> Units
        </h2>

        <ul className="space-y-2 flex-1 overflow-y-auto">
          {units.length === 0 && !isLoading && (
            <p className="text-gray-200 px-2">No units found.</p>
          )}

          {units.map((unit) => (
            <li key={unit.unitCode}>
              <button
                onClick={() => {
                  setSelectedUnit(unit);
                  fetchNotes(unit.unitCode);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg hover:bg-[#5d846c] transition-colors ${
                  selectedUnit?.unitCode === unit.unitCode ? "bg-[#3e6047] font-semibold" : ""
                }`}
              >
                {unit.unitName} ({unit.unitCode})
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Notes Section */}
      <section className="flex-1 p-8 overflow-y-auto">
        {selectedUnit ? (
          <>
            <h1 className="text-3xl font-bold mb-4">
              Notes for {selectedUnit.unitName} ({selectedUnit.unitCode})
            </h1>

            {loadingNotes ? (
              <p className="text-gray-600">Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="text-gray-600">No notes available for this unit.</p>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                <AnimatePresence>
                  {notes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-between items-center bg-[#D0DCD0] rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{note.title}</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(note.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => openModal(note.filePath)}
                        className="bg-[#50765F] text-white px-4 py-2 rounded-lg hover:bg-[#3e6047] transition-colors"
                      >
                        View
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-600">Select a unit to view notes.</p>
        )}

        {isLoading && (
          <p className="text-gray-600 mt-4 text-lg">Loading your units, please wait...</p>
        )}
      </section>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && modalFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`bg-white w-full max-w-4xl h-[80vh] rounded-lg flex flex-col overflow-hidden relative ${
                isFullscreen ? "w-full h-full max-w-full max-h-full" : ""
              }`}
            >
              <div className="flex justify-between items-center p-3 bg-[#50765F] text-white">
                <h2 className="font-bold text-lg">Note Viewer</h2>
                <div className="flex gap-2">
                  <a
                    href={modalFile}
                    download
                    className="hover:text-gray-300 flex items-center gap-1"
                  >
                    <FaDownload /> Download
                  </a>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="hover:text-gray-300"
                  >
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                  </button>
                  <button onClick={closeModal} className="hover:text-gray-300">
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-gray-100 overflow-auto p-2">
                {renderFileContent(modalFile)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
