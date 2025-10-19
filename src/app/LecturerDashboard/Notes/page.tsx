"use client";

import React, { useState, useEffect } from "react";
import { FaPaperclip, FaEye, FaEyeSlash, FaDownload, FaUpload } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { usePageTitle } from "../layout";

interface NoteItem {
  id: string;
  title: string;
  filename?: string;
  unitCode?: string;
  uploadedAt?: string;
  visibleToStudents?: boolean;
}

const LecturerNotes = () => {
  const { setTitle } = usePageTitle();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [title, setNoteTitle] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setTitle("Notes & Materials");

    // Dummy data
    const dummyNotes: NoteItem[] = [
      {
        id: "n1",
        title: "Week 1 Lecture Notes",
        filename: "intro_programming.pdf",
        unitCode: "CSC101",
        uploadedAt: new Date().toISOString(),
        visibleToStudents: true,
      },
      {
        id: "n2",
        title: "Assignment 1",
        filename: "assignment1.docx",
        unitCode: "CSC204",
        uploadedAt: new Date().toISOString(),
        visibleToStudents: false,
      },
    ];
    setNotes(dummyNotes);
  }, [setTitle]);

  const handleUpload = () => {
    if (!title || !unitCode || !file)
      return toast.error("Please fill in title, unit, and select a file");

    const newNote: NoteItem = {
      id: String(Date.now()),
      title,
      filename: file.name,
      unitCode,
      uploadedAt: new Date().toISOString(),
      visibleToStudents: visible,
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteTitle("");
    setUnitCode("");
    setFile(null);
    toast.success("Note uploaded (mock)");
  };

  const toggleVisibility = (id: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, visibleToStudents: !n.visibleToStudents }
          : n
      )
    );
  };

  return (
    <div className="p-6">
      <p className="text-sm text-gray-600 mb-6">
        Upload lecture notes, assignments, and toggle visibility for students.
      </p>

      {/* Upload Form */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={title}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            className="p-2 border rounded"
          />
          <input
            value={unitCode}
            onChange={(e) => setUnitCode(e.target.value)}
            placeholder="Unit code (e.g. CSC201)"
            className="p-2 border rounded"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="p-2"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />{" "}
            <span>Visible to students</span>
          </label>
          <button
            onClick={handleUpload}
            className="px-4 py-2 rounded bg-[#50765F] text-white"
          >
            <FaUpload className="inline mr-1" /> Upload
          </button>
        </div>
      </div>

      {/* Notes List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        {notes.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <FaPaperclip className="text-[#50765F]" />
              <div>
                <div className="font-semibold text-gray-800">{n.title}</div>
                <div className="text-xs text-gray-500">
                  {n.unitCode} • {n.filename} •{" "}
                  {new Date(n.uploadedAt || "").toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleVisibility(n.id)}
                className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                  n.visibleToStudents
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {n.visibleToStudents ? <FaEye /> : <FaEyeSlash />}
                {n.visibleToStudents ? "Visible" : "Hidden"}
              </button>
              <button
                onClick={() => toast("Download mock")}
                className="px-3 py-1 rounded border text-sm flex items-center gap-2"
              >
                <FaDownload /> Download
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default LecturerNotes;
