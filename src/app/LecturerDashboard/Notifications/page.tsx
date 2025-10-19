"use client";

import React, { useState, useEffect } from "react";
import { FaBell, FaTrash, FaCheckCircle, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { usePageTitle } from "../layout";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  targetType: string;
  targetValue?: string;
  read?: boolean;
}

const LecturerNotifications = () => {
  const { setTitle } = usePageTitle();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [notifTitle, setNotifTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetValue, setTargetValue] = useState("");

  // Dummy courses (replace with fetched API data)
  const courses = ["BSc Information Technology", "BCom Accounting", "BSc Computer Science"];

  useEffect(() => {
    setTitle("Notifications");
    const dummy: NotificationItem[] = [
      {
        id: "m1",
        title: "Class Cancelled",
        message: "CSC201 class at 10AM cancelled",
        createdAt: new Date().toISOString(),
        targetType: "all",
        read: false,
      },
      {
        id: "m2",
        title: "Reschedule",
        message: "Extra session for CSC205 tomorrow 3PM",
        createdAt: new Date().toISOString(),
        targetType: "course",
        targetValue: "BSc Information Technology",
        read: true,
      },
    ];
    setNotifications(dummy);
  }, [setTitle]);

  const sendNotification = () => {
    if (!notifTitle || !message) {
      toast.error("Please enter title and message");
      return;
    }

    const newNotif: NotificationItem = {
      id: String(Date.now()),
      title: notifTitle,
      message,
      createdAt: new Date().toISOString(),
      targetType,
      targetValue: targetValue || undefined,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setNotifTitle("");
    setMessage("");
    setTargetType("all");
    setTargetValue("");
    setShowModal(false);

    toast.success("Notification sent (mock)");
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast("Notification deleted (mock)");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Send announcements to students or message the admin.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#50765F] text-white hover:bg-[#3d5c4b]"
        >
          <FaPlus /> New Notification
        </button>
      </div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between bg-white p-4 rounded-lg shadow-sm border ${
              n.read ? "border-gray-200" : "border-green-200"
            }`}
          >
            <div>
              <div className="font-semibold text-gray-800 flex items-center gap-2">
                <FaBell className="text-[#50765F]" /> {n.title}
              </div>
              <div className="text-sm text-gray-600">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()} •{" "}
                {n.targetType === "all"
                  ? "All Students"
                  : n.targetType === "course"
                  ? `Course: ${n.targetValue}`
                  : n.targetType === "student"
                  ? `Student: ${n.targetValue}`
                  : "Admin"}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="px-3 py-1 text-sm rounded bg-[#50765F] text-white flex items-center gap-2"
                >
                  <FaCheckCircle /> Mark Read
                </button>
              )}
              <button
                onClick={() => deleteNotification(n.id)}
                className="px-3 py-1 text-sm rounded border flex items-center gap-2"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Create Notification</h2>

            <div className="space-y-3">
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Title"
                className="w-full p-2 border rounded"
              />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                className="w-full p-2 border rounded h-24"
              />

              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Students</option>
                <option value="course">Specific Course</option>
                <option value="student">Specific Student</option>
                <option value="admin">Message Admin</option>
              </select>

              {/* Conditional fields */}
              {targetType === "course" && (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              )}

              {targetType === "student" && (
                <input
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Student Registration Number"
                  className="w-full p-2 border rounded"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-5 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                className="px-4 py-2 rounded bg-[#50765F] text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerNotifications;
