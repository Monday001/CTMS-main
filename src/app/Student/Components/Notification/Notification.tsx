"use client";
import { IoClose, IoChevronDown, IoChevronUp, IoTrash } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationType {
  id: string;
  lecturer: string;
  venue: string;
  unit: string;
  classTime: string | null;
  detail: string;
  read?: boolean;
}

interface Props {
  registrationNumber: string;
  onNotificationRead?: () => void;
  onNewNotification?: (count: number) => void;
  onClose: () => void;
}

const Notification: React.FC<Props> = ({
  registrationNumber,
  onNotificationRead,
  onNewNotification,
  onClose,
}) => {
  const [noteCount, setNoteCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // --- Fetch notifications ---
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`/api/users/notification?regNo=${registrationNumber}`);
      if (Array.isArray(res.data)) {
        const processed = res.data.map((n: any) => ({
          ...n,
          read: n.read === 1 || n.read === true,
        })) as NotificationType[];

        setNotifications(processed);
        const unreadCount = processed.filter((n) => !n.read).length;
        setNoteCount(unreadCount);
        onNewNotification?.(unreadCount);
      }
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err);
    }
  };

  // --- Mark notification as read locally ---
  const markAsReadLocally = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setNoteCount((prev) => Math.max(0, prev - 1));
    onNotificationRead?.();
  };

  // --- Clear (delete) a notification locally + inform backend ---
  const clearNotification = async (id: string) => {
    // remove from local state immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await axios.delete(`/api/users/notification/${id}`);
    } catch (err) {
      console.error(`❌ Failed to clear notification ${id}:`, err);
    }
  };

  // --- Mark all as read locally ---
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setNoteCount(0);
    onNotificationRead?.();
    onNewNotification?.(0);
  };

  const handleNotificationClick = (notification: NotificationType) => {
    if (expandedId === notification.id) {
      setExpandedId(null);
    } else {
      setExpandedId(notification.id);
      if (!notification.read) markAsReadLocally(notification.id);
    }
  };

  // --- Poll notifications every 60s ---
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, [registrationNumber]);

  // --- Render ---
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-full right-0 mt-2 z-50"
    >
      <main className="bg-white rounded-lg shadow-lg w-80 max-h-[350px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-100 rounded-t-lg">
          <div className="flex items-center space-x-2">
            {noteCount > 0 && (
              <span className="bg-green-500 w-3 h-3 rounded-full inline-block"></span>
            )}
            <h1 className="text-black font-bold">
              Notifications ({noteCount})
            </h1>
          </div>
          <button onClick={onClose}>
            <IoClose className="text-black" />
          </button>
        </div>

        {/* Notification list */}
        <div className="my-1">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.p
                key="no-notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-500 py-4"
              >
                No notifications
              </motion.p>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-2 flex flex-col bg-slate-300 rounded my-1 mx-2 cursor-pointer ${
                    notification.read ? "opacity-60" : "opacity-100"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-white mr-1 p-1 rounded-lg h-8 w-8 flex justify-center items-center flex-shrink-0">
                        <FaUser className="text-black w-4 h-4" />
                      </div>
                      <div className="flex flex-col ml-1">
                        <h1 className="text-sm font-bold text-black">
                          {notification.lecturer || "System Reminder"}
                        </h1>
                        <div className="flex">
                          <span className="text-sm font-bold text-stone-900">
                            {notification.unit}
                          </span>
                          <span className="text-stone-700 text-sm ml-2">
                            {notification.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto p-1 flex items-center space-x-2">
                      {expandedId === notification.id && (
                        <IoTrash
                          className="text-red-500 w-4 h-4 cursor-pointer hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent collapse
                            clearNotification(notification.id);
                          }}
                          title="Clear notification"
                        />
                      )}
                      {expandedId === notification.id ? (
                        <IoChevronUp className="text-black w-4 h-4" />
                      ) : (
                        <IoChevronDown className="text-black w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Detail */}
                  <AnimatePresence>
                    {expandedId === notification.id && (
                      <motion.div
                        key={`detail-${notification.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2 border-t border-gray-400">
                          <span className="text-stone-800 text-sm block mb-1">
                            {notification.detail}
                          </span>
                          {notification.classTime && (
                            <span className="font-semibold text-blue-700 text-sm block">
                              Time: {notification.classTime}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className="py-2 bg-blue-200 rounded-b-lg text-center cursor-pointer hover:bg-blue-300 transition"
            onClick={markAllAsRead}
          >
            <h1 className="text-sm font-semibold text-gray-700">
              Mark all as read
            </h1>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default Notification;
