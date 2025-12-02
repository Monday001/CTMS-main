"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FaPaperclip, FaEye, FaEyeSlash, FaDownload, FaUpload } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { usePageTitle } from "../layout";
import axios from "axios";

interface NoteItem {
  id: string;
  title: string;
  unitCode: string;
  filePath: string;
  uploadedAt: string;
  visibleToStudents: number;
}

const LecturerNotes = () => {
  const { setTitle } = usePageTitle();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [title, setNoteTitle] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const queryUnitCode = searchParams.get("unitCode");

  /* -------------------------------------------------------------------------- */
  /*                            Fetch Notes from API                            */
  /* -------------------------------------------------------------------------- */
  const fetchNotes = async () => {
    try {
      const url = queryUnitCode
        ? `/api/users/lecturer/notes?unitCode=${queryUnitCode}`
        : `/api/users/lecturer/notes`;

      const res = await axios.get(url);
      if (res.data.success) {
        setNotes(res.data.notes);
      } else {
        toast.error("Failed to fetch notes");
      }
    } catch (err: any) {
      console.error("Fetch notes error:", err);
      toast.error("Could not load notes");
    }
  };

  useEffect(() => {
    setTitle("Notes & Materials");
    if (queryUnitCode) setUnitCode(queryUnitCode);
    fetchNotes();
  }, [setTitle, queryUnitCode]);

  /* -------------------------------------------------------------------------- */
  /*                            Upload Notes to Server                          */
  /* -------------------------------------------------------------------------- */
  const handleUpload = async () => {
    if (!title || !unitCode || !file)
      return toast.error("Please fill in title, unit, and select a file");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", file);

      const res = await axios.post(
        `/api/users/lecturer/notes?unitCode=${unitCode}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        toast.success("Note uploaded successfully");
        fetchNotes();
        setNoteTitle("");
        if (!queryUnitCode) setUnitCode("");
        setFile(null);
      } else {
        toast.error(res.data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Error uploading note");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                          Toggle Note Visibility                            */
  /* -------------------------------------------------------------------------- */
  const toggleVisibility = async (id: string, currentVisible: number) => {
    try {
      const newVisible = currentVisible === 1 ? 0 : 1;

      const res = await axios.patch(`/api/users/lecturer/notes`, {
        noteId: id,
        visible: newVisible,
      });

      if (res.data.success) {
        toast.success(
          newVisible ? "Note is now visible to students" : "Note hidden from students"
        );

        setNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, visible_to_students: newVisible } : n
          )
        );
      } else {
        toast.error("Failed to update visibility");
      }
    } catch (err: any) {
      console.error("Toggle error:", err);
      toast.error("Could not toggle visibility");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
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
            disabled={!!queryUnitCode}
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
            disabled={loading}
            className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
              loading ? "bg-gray-400" : "bg-[#50765F] hover:bg-[#406250]"
            }`}
          >
            <FaUpload /> {loading ? "Uploading..." : "Upload"}
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
        {notes.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center">
            No notes uploaded yet.
          </p>
        )}

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
                  {n.unitCode} • {n.filePath?.split("/").pop()} •{" "}
                  {new Date(n.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleVisibility(n.id, n.visibleToStudents)}
                className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                  n.visibleToStudents
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {n.visibleToStudents ? <FaEye /> : <FaEyeSlash />}
                {n.visibleToStudents ? "Visible" : "Hidden"}
              </button>
              <a
                href={n.filePath}
                download
                className="px-3 py-1 rounded border text-sm flex items-center gap-2 hover:bg-gray-50"
              >
                <FaDownload /> Download
              </a>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default LecturerNotes;
