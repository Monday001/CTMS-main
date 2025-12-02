"use client";
import * as React from "react";
import { IoClose, IoChevronDown, IoChevronUp, IoTrash } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationType {
  id: string;
  lecturer: string;
  venue: string;
  unitCode: string;
  classTime: string | null;
  message: string;
  read?: boolean;
}

interface Props {
  registrationNumber: string;
  showNotification: boolean;
  notifications: NotificationType[];
  setNotifications: (n: NotificationType[] | ((prev: NotificationType[]) => NotificationType[])) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClose: () => void;
}

const Notification: React.FC<Props> = ({
  registrationNumber,
  showNotification,
  notifications,
  setNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClose,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Since notifications are lifted, this component does NOT fetch.
  // It just shows the list and calls handlers to update the parent state.

  const handleClick = (id: string, read: boolean) => {
    setExpandedId((prev) => (prev === id ? null : id));

    if (!read) {
      // optimistic UI update via parent handler
      onMarkAsRead(id);
      // parent will update notifications state (optimistic)
    }
  };

  const handleClearNotification = (id: string) => {
    onClearNotification(id);
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  const noteCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-full right-0 mt-3 z-50"
    >
      <main className="bg-white rounded-lg shadow-lg w-80 max-h-[350px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-blue-100 rounded-t-lg">
          <div className="flex items-center space-x-2">
            {noteCount > 0 && (
              <span className="bg-green-500 w-3 h-3 rounded-full inline-block"></span>
            )}
            <h1 className="text-black font-bold">Notifications ({noteCount})</h1>
          </div>
          <button onClick={onClose}>
            <IoClose className="text-black" />
          </button>
        </div>

        {/* Notification List */}
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
                  onClick={() =>
                    handleClick(notification.id, notification.read || false)
                  }
                >
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
                            {notification.unitCode}
                          </span>
                          <span className="text-stone-700 text-sm ml-2">
                            {notification.venue}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                      {expandedId === notification.id && (
                        <IoTrash
                          className="text-red-500 w-4 h-4 cursor-pointer hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearNotification(notification.id);
                          }}
                        />
                      )}
                      {expandedId === notification.id ? (
                        <IoChevronUp className="text-black w-4 h-4" />
                      ) : (
                        <IoChevronDown className="text-black w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {expandedId === notification.id && (
                    <motion.div
                      key={`detail-${notification.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-2 pt-2 border-t border-gray-400"
                    >
                      <span className="text-stone-800 text-sm block mb-1">
                        {notification.message}
                      </span>
                      {notification.classTime && (
                        <span className="font-semibold text-blue-700 text-sm block">
                          Time: {notification.classTime}
                        </span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {notifications.some((n) => !n.read) && (
          <div
            className="py-2 bg-blue-200 rounded-b-lg text-center cursor-pointer hover:bg-blue-300 transition"
            onClick={handleMarkAllAsRead}
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
