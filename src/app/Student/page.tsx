"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import Notification from "./Components/Notification/Notification";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  registrationNumber: string;
  yearOfStudy: string | number;
  course: string;
  firstname?: string;
  lastname?: string;
}

const Student = () => {
  const router = useRouter();

  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [userCourse, setUserCourse] = useState("Loading Course...");
  const [userYearRaw, setUserYearRaw] = useState("...");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [userName, setUserName] = useState("Student");
  const [fullName, setFullName] = useState("Student");

  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedTimetable, setSelectedTimetable] = useState<any>({});
  const [currentTimeOfDayPerDay, setCurrentTimeOfDayPerDay] = useState<{ [day: string]: string }>({});
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const notificationRef = useRef<HTMLDivElement>(null);

  const displayYear = useMemo(() => String(userYearRaw), [userYearRaw]);
  const today = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long" }), []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 16) return "Good afternoon";
    return "Good evening";
  };

  const getCurrentSlot = (daySlots: Record<string, any>) => {
    const now = new Date();
    const hour = now.getHours();
    const sortedSlots = Object.keys(daySlots).sort(
      (a, b) => parseInt(a.split(":")[0]) - parseInt(b.split(":")[0])
    );
    for (const slot of sortedSlots) {
      const [start, end] = slot.split("-").map((t) => parseInt(t.split(":")[0]));
      if (hour >= start && hour < end) return slot;
    }
    return sortedSlots[0] || "";
  };

  useEffect(() => {
    const getUserDetails = async (): Promise<{ year: string; course: string }> => {
      let yearToFetchKey = "4";
      let course = "";
      try {
        const res = await axios.get("/api/users/me");
        const userData: UserData = res.data.data;

        if (userData.firstname) setUserName(userData.firstname.split(" ")[0]);
        if (userData.firstname && userData.lastname) {
          setFullName(`${userData.firstname} ${userData.lastname}`);
        }

        setRegistrationNumber(userData.registrationNumber);
        setUserCourse(userData.course);
        setUserYearRaw(String(userData.yearOfStudy));

        yearToFetchKey = String(userData.yearOfStudy);
        course = userData.course;
      } catch (error) {
        toast.error("Failed to load user data.");
      }
      return { year: yearToFetchKey, course };
    };

    const loadTimetable = async (yearKey: string, course: string) => {
      setIsLoading(true);
      try {
        const resFile = await fetch("/api/users/timetable?type=current");
        const fileDetails = await resFile.json();

        if (!fileDetails.filePath) {
          toast.error("No timetable found");
          return;
        }

        const parserRes = await fetch(`/api/users/timetable/parser?path=${fileDetails.filePath}`);
        const parsed = await parserRes.json();

        if (!parsed[yearKey]) {
          toast.error(`No timetable found for year ${yearKey}`);
          setSelectedTimetable({});
        } else {
          const yearTimetable = parsed[yearKey];
          const filteredTimetable: any = {};

          for (const day in yearTimetable) {
            const daySlots = yearTimetable[day];
            const filteredSlots: any = {};

            for (const slot in daySlots) {
              const classDetails = daySlots[slot];
              if (classDetails?.course_name === course) filteredSlots[slot] = classDetails;
            }
            filteredTimetable[day] = filteredSlots;
          }

          setSelectedTimetable(filteredTimetable);

          const initialTimePerDay: any = {};
          for (const day in filteredTimetable) {
            const slots = filteredTimetable[day];
            if (Object.keys(slots).length > 0)
              initialTimePerDay[day] = getCurrentSlot(slots);
          }
          setCurrentTimeOfDayPerDay(initialTimePerDay);

          setSelectedDay(filteredTimetable[today] ? today : Object.keys(filteredTimetable)[0] || "");
        }
      } catch (err: any) {
        toast.error("Error fetching timetable: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const initialize = async () => {
      const { year, course } = await getUserDetails();
      await loadTimetable(year, course);
    };
    initialize();
  }, [today]);

  const logout = async () => {
    try {
      await axios.get("/api/users/logout");
      toast.success("Logout successful");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTimeClick = (day: string, time: string) => {
    setCurrentTimeOfDayPerDay((prev) => ({ ...prev, [day]: time }));
    setSelectedDay(day);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotification(false);
      }
    };
    if (showNotification) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotification]);

  return (
    <main className="relative flex flex-col w-full h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full py-5 px-6 flex justify-between items-center bg-[#50765F] shadow-md">
        <div className="text-slate-100 text-xl font-semibold">
          {getGreeting()}, {userName} 👋
        </div>

        <div className="flex items-center space-x-5 relative">
          {/* Notification Icon */}
          <div className="relative flex items-center justify-center" ref={notificationRef}>
            <button
              onClick={() => setShowNotification((prev) => !prev)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#5d846c] transition"
            >
              <IoMdNotificationsOutline className="w-6 h-6 text-slate-200" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotification && registrationNumber && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-3 z-50"
                >
                  <Notification
                    registrationNumber={registrationNumber}
                    onNotificationRead={() => setUnreadCount((prev) => Math.max(0, prev - 1))}
                    onNewNotification={(count) => setUnreadCount(count)}
                    onClose={() => setShowNotification(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Icon */}
          <div className="relative">
            <FaUserCircle
              className="w-8 h-8 text-slate-200 hover:text-white cursor-pointer"
              onClick={() => setShowProfile(!showProfile)}
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
                    <h2 className="font-semibold text-lg text-gray-800">{fullName}</h2>
                  </div>
                  <div className="border-b pb-2 mb-2 text-center text-sm">
                    Reg No: <span className="font-medium">{registrationNumber}</span>
                  </div>
                  <div className="border-b pb-2 mb-2 text-center text-sm">
                    Course: <span className="font-medium">{userCourse}</span>
                  </div>
                  <div className="border-b pb-2 mb-3 text-center text-sm">
                    Year: <span className="font-medium">{displayYear}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
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

      {/* Timetable Section */}
      <div className="flex-1 overflow-y-auto pt-[90px] pb-6 w-full">
        <section className="grid pl-12 my-6 gap-x-0 items-center justify-center mx-auto w-full grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <p className="text-xl col-span-full text-black">
              Loading timetable for year {displayYear} ...
            </p>
          )}

          {!isLoading &&
            Object.keys(selectedTimetable).map((day, dayIndex) => {
              const daySlots = selectedTimetable[day];
              const currentTimeOfDay = currentTimeOfDayPerDay[day] || Object.keys(daySlots)[0] || "";
              const classDetails = daySlots[currentTimeOfDay];

              let message = "";
              if (!Object.keys(daySlots).length) message = "No class today";
              else if (!classDetails) message = "No class right now";

              const isSelected = day === selectedDay;

              return (
                <motion.div
                  key={dayIndex}
                  layout
                  onClick={() => setSelectedDay(day)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-center items-center w-[80%] bg-[#D0DCD0] shadow-md rounded-lg cursor-pointer relative"
                >
                  <div className="flex items-center justify-between p-3 bg-[#50765F] w-full rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-100">{day}</h2>
                    <span className="font-semibold text-base text-slate-200">
                      {classDetails?.unitName || ""}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="underline"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute bottom-0 left-0 w-full h-1 bg-[#50765F] rounded-b-lg"
                    />
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTimeOfDay}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col w-full p-3"
                    >
                      {classDetails ? (
                        <>
                          <div className="my-2 flex">
                            <label className="text-gray-700 w-20">Unit code:</label>
                            <span className="font-bold">{classDetails?.unitCode}</span>
                          </div>
                          <div className="my-2 flex">
                            <label className="text-gray-700 w-20">Time:</label>
                            <span className="font-bold">{classDetails.time}</span>
                          </div>
                          <div className="my-2 flex">
                            <label className="text-gray-700 w-20">Venue:</label>
                            <span className="font-bold">{classDetails.venue}</span>
                          </div>
                          <div className="my-2 flex">
                            <label className="text-gray-700 w-20">Lecturer:</label>
                            <span className="font-bold">{classDetails.lec}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-600 text-center">{message}</p>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="flex justify-center mx-auto w-full p-3 items-center">
                    {Object.keys(daySlots).length > 0 &&
                      Object.keys(daySlots).map((time) => (
                        <div
                          key={time}
                          onClick={() => handleTimeClick(day, time)}
                          className={`bg-[#50765F] w-3 h-3 rounded-full mx-1 cursor-pointer transition-all duration-300 ${
                            currentTimeOfDay === time ? "opacity-100 scale-125" : "opacity-30 scale-100"
                          }`}
                        ></div>
                      ))}
                  </div>
                </motion.div>
              );
            })}

          {!isLoading && Object.keys(selectedTimetable).length === 0 && (
            <p className="text-xl col-span-full">
              No timetable data found for <strong>{displayYear}</strong>.
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Student;
