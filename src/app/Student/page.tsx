"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { IoMdNotificationsOutline, IoIosLogOut } from "react-icons/io";
import { FaUserCircle, FaBook } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Notification, { NotificationType } from "./Components/Notification/Notification";

interface UserData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  registrationNumber: string;
  yearOfStudy: number;
  course: string;
}

interface TimetableSlot {
  course_name: string;
  unitCode?: string;
  unitName?: string;
  time?: string;
  venue?: string;
  lec?: string;
}

type TimetableByDay = Record<string, Record<string, TimetableSlot>>;

const POLL_INTERVAL_MS = 8000;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

const Student: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableByDay>({});
  const [currentSlotPerDay, setCurrentSlotPerDay] = useState<Record<string, string>>({});
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const locallyReadIds = useRef<Set<string>>(new Set());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  const today = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
    []
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12
      ? "Good morning"
      : hour < 16
      ? "Good afternoon"
      : "Good evening";
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.get("/api/users/logout");
    } catch {}
    toast("Session expired. Please login again", {
      icon: "ℹ️",
      style: { background: "#f0f0f0", color: "#333" },
    });
    router.push("/login");
  }, [router]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      toast("Session expired due to inactivity. Please login again", {
        icon: "⚠️",
        style: { background: "#f0f0f0", color: "#333" },
      });
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const events = ["click", "mousemove", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [resetInactivityTimer]);

  const getNearestSlot = (slots: Record<string, TimetableSlot>) => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let closest = "";
    let minDiff = Infinity;
    Object.entries(slots).forEach(([key, slot]) => {
      if (!slot.time) return;
      const [start] = slot.time.split(/–|-/);
      const [h, m] = start.split(":").map(Number);
      const slotMins = h * 60 + m;
      const diff = Math.abs(slotMins - nowMins);
      if (diff < minDiff) {
        minDiff = diff;
        closest = key;
      }
    });
    return closest;
  };

  const handleTimeClick = (day: string, slot: string) => {
    setSelectedDay(day);
    setCurrentSlotPerDay((prev) => ({ ...prev, [day]: slot }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get("/api/users/me");
        const user: UserData = res.data.data;
        setUserData(user);

        const fileRes = await fetch("/api/users/timetable?type=current");
        const fileJson = await fileRes.json();
        if (!fileJson.filePath) {
          toast.error("No timetable available.");
          return;
        }

        const parseRes = await fetch(`/api/users/timetable/parser?path=${fileJson.filePath}`);
        const parsed: { byYear?: Record<string, TimetableByDay> } = await parseRes.json();
        const byYear = parsed.byYear?.[String(user.yearOfStudy)];
        if (!byYear) {
          toast.error("No timetable for your year.");
          return;
        }

        const filtered: TimetableByDay = {};
        Object.keys(byYear).forEach((day) => {
          const slots = byYear[day];
          filtered[day] = Object.fromEntries(
            Object.entries(slots).filter(([_, slot]) => slot.course_name === user.course)
          ) as Record<string, TimetableSlot>;
        });
        setSelectedTimetable(filtered);

        const currentSlots: Record<string, string> = {};
        Object.keys(filtered).forEach((day) => {
          const nearest = getNearestSlot(filtered[day]);
          if (nearest) currentSlots[day] = nearest;
        });
        setCurrentSlotPerDay(currentSlots);

        setSelectedDay(filtered[today] ? today : Object.keys(filtered)[0] || "");
      } catch (e: any) {
        if (axios.isAxiosError(e) && e.response?.status === 401) return logout();
        toast.error("Failed to load student data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [today, logout]);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/users/notification");
        if (!res.ok && res.status === 401) return logout();
        const data = await res.json();
        const list: NotificationType[] = Array.isArray(data)
          ? data
          : data.notifications || data.data || [];
        const merged = list.map((n) =>
          locallyReadIds.current.has(n.id) ? { ...n, read: true } : n
        );
        if (!active) return;
        setNotifications(merged);
        setUnreadCount(merged.filter((n) => !n.read).length);
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [logout]);

  const markAsRead = useCallback(
    async (id: string) => {
      locallyReadIds.current.add(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((u) => Math.max(0, u - 1));
      try {
        await fetch("/api/users/notification/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {}
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    notifications.forEach((n) => locallyReadIds.current.add(n.id));
    try {
      await fetch("/api/users/notification/mark-all-read", { method: "POST" });
    } catch {}
  }, [notifications]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    locallyReadIds.current.delete(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotification(false);
      }
    };
    if (showNotification) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotification]);

  if (!userData) return null;

  return (
    <main className="relative flex flex-col w-full h-screen bg-white overflow-hidden">
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <p className="text-xl font-semibold text-gray-700">Loading timetable...</p>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full py-5 px-6 flex justify-between items-center bg-[#50765F] shadow-md">
        <div className="text-slate-100 text-xl font-semibold">
          {greeting}, {userData.firstname?.split(" ")[0] || "Student"} 👋
        </div>
        <div className="flex items-center space-x-5 relative">
          <button
            onClick={() => router.push("/Student/notes")}
            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#5d846c]"
          >
            <FaBook className="w-6 h-6 text-slate-200" />
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotification((s) => !s)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#5d846c]"
            >
              <IoMdNotificationsOutline className="w-6 h-6 text-slate-200" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-4 px-1 text-[11px] leading-4 text-white rounded-full bg-red-500 flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-3 z-50"
                >
                  <Notification
                    registrationNumber={userData.registrationNumber}
                    showNotification={showNotification}
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClearNotification={clearNotification}
                    onClose={() => setShowNotification(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <FaUserCircle
              className="w-8 h-8 text-slate-200 hover:text-white cursor-pointer"
              onClick={() => setShowProfile((p) => !p)}
            />
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-0 mt-3 w-64 bg-white text-gray-700 rounded-xl shadow-lg p-4 z-50"
                >
                  <div className="border-b pb-2 mb-2 text-center">
                    <h2 className="font-semibold text-lg">{userData.firstname} {userData.lastname}</h2>
                  </div>
                  <div className="border-b pb-2 mb-2 text-center text-sm">
                    Reg No: <span className="font-medium">{userData.registrationNumber}</span>
                  </div>
                  <div className="border-b pb-2 mb-2 text-center text-sm">
                    Course: <span className="font-medium">{userData.course}</span>
                  </div>
                  <div className="border-b pb-3 mb-3 text-center text-sm">
                    Year: <span className="font-medium">{userData.yearOfStudy}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    <IoIosLogOut className="inline-block mr-2" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* TIMETABLE */}
      <div className="flex-1 overflow-y-auto pt-[90px] pb-6 w-full">
        <section className="grid gap-6 p-6 justify-center mx-auto w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {!isLoading &&
            Object.keys(selectedTimetable).map((day) => {
              const slots = selectedTimetable[day];
              const currentSlot = currentSlotPerDay[day] || Object.keys(slots)[0] || "";
              const details = slots[currentSlot];
              const isSelected = day === selectedDay;

              let message = "";
              if (!Object.keys(slots).length) message = "No class today";
              else if (!details) message = "No class right now";

              return (
                <motion.div
                  key={day}
                  layout
                  onClick={() => setSelectedDay(day)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col justify-center items-center w-full max-w-sm bg-[#D0DCD0] shadow-md rounded-lg cursor-pointer relative"
                >
                  <div className="flex items-center justify-between p-3 bg-[#50765F] w-full rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-100 break-words">{day}</h2>
                    <span className="font-semibold text-base text-slate-200 break-words">{details?.unitName || ""}</span>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="underline"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute bottom-0 left-0 w-full h-1 bg-[#50765F]"
                    />
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlot}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col w-full p-3"
                    >
                      {details ? (
                        <>
                          <div className="my-2 flex flex-wrap">
                            <span className="text-gray-700 w-24">Unit:</span>
                            <span className="font-bold break-words">{details.unitCode}</span>
                          </div>
                          <div className="my-2 flex flex-wrap">
                            <span className="text-gray-700 w-24">Time:</span>
                            <span className="font-bold break-words">{details.time}</span>
                          </div>
                          <div className="my-2 flex flex-wrap">
                            <span className="text-gray-700 w-24">Venue:</span>
                            <span className="font-bold break-words">{details.venue}</span>
                          </div>
                          <div className="my-2 flex flex-wrap">
                            <span className="text-gray-700 w-24">Lecturer:</span>
                            <span className="font-bold break-words">{details.lec}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-gray-500">{message}</p>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex justify-center mx-auto w-full p-3 flex-wrap gap-2">
                    {Object.keys(slots).map((slot) => (
                      <div
                        key={slot}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeClick(day, slot);
                        }}
                        className={`bg-[#50765F] w-3 h-3 rounded-full cursor-pointer transition-all ${
                          currentSlot === slot ? "opacity-100 scale-125" : "opacity-30"
                        }`}
                      ></div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

          {!isLoading && Object.keys(selectedTimetable).length === 0 && (
            <p className="text-xl col-span-full text-center">No timetable found</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Student;
