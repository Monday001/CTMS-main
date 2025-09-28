"use client";
import React, { useState, useEffect } from "react";
import { IoMdHome, IoMdNotificationsOutline } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import Notification from "./Components/Notification/Notification";
import Link from "next/link";
import { BsFileEarmarkText } from "react-icons/bs";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Student = () => {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState("BSc IT");
  const [selectedYear, setSelectedYear] = useState("Y1S2");
  const [showNotification, setShowNotification] = useState(false);

  // timetable fetched from API 
  const [selectedTimetable, setSelectedTimetable] = useState<any>({});
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<string>("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  const timesOfDay = ["morning", "mid_morning", "evening", "late_evening"];
  const [selectedItems, setSelectedItems] = useState<Array<string | null>>(
    Array(timesOfDay.length).fill(null)
  );

  // ⬇️ Fetch timetable data from backend API (parsed from PDF)
  useEffect(() => {
    async function loadTimetable() {
      try {
        const res = await fetch("/api/timetable");
        const data = await res.json();
        setSelectedTimetable(data[selectedYear] || {}); // use selected year
      } catch (err) {
        console.error("Failed to fetch timetable", err);
      }
    }
    loadTimetable();
  }, [selectedYear]);

  // keep track of time-of-day slot
  const handleUpdateTimeOfDay = () => {
    const currentHour = new Date().getHours();
    let timeOfDay;
    if (currentHour < 10) timeOfDay = "morning";
    else if (currentHour < 13) timeOfDay = "mid_morning";
    else if (currentHour < 16) timeOfDay = "evening";
    else timeOfDay = "late_evening";
    setCurrentTimeOfDay(timeOfDay);
  };

  useEffect(() => {
    handleUpdateTimeOfDay();
    const interval = setInterval(handleUpdateTimeOfDay, 60000);

    // fetch user details
    const getUserDetails = async () => {
      try {
        const res = await axios.get("/api/users/me");
        setRegistrationNumber(res.data.data.registrationNumber);
      } catch (error) {
        console.error(error);
      }
    };
    getUserDetails();

    return () => clearInterval(interval);
  }, []);

  const getCurrentDay = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    const currentDate = new Date();
    return days[currentDate.getDay()];
  };

  const handleItemClick = (index: number, timeOfDay: string) => {
    const currentDay = getCurrentDay();
    if (!selectedTimetable[currentDay]) return;

    const currentItem = selectedTimetable[currentDay][timeOfDay];
    const newSelectedItems = timesOfDay.map(() => null);
    newSelectedItems[index] = currentItem ? currentItem.unit : null;

    setSelectedItems(newSelectedItems);
    setCurrentTimeOfDay(timeOfDay);
  };

  const logout = async () => {
    try {
      await axios.get("/api/users/logout");
      toast.success("Logout successful");
      router.push("/login");
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
    }
  };

  return (
    <main className="flex flex-col justify-center place-items-center items-center mx-auto w-full overflow-x-hidden">
      <nav className="py-6 flex justify-between place-items-center items-center mx-auto relative w-[100vw] shadow-lg">
        <div className="flex items-center w-[80%] mx-auto justify-around">
          <Link
            className="bg-[#50765F] p-1 rounded-lg flex justify-center items-center"
            href="/"
          >
            <div className="flex items-center">
              <IoMdHome className="relative w-5 h-5 ml-1 mr-1 text-slate-300" />
              <span className=" text-base text-slate-300">Home</span>
            </div>
          </Link>

          <div className="flex items-center">
            {/* course selector (still here for future multiple courses) */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-[#50765F] rounded-lg px-2 py-1 mr-2"
            >
              <option value="BSc IT">BSc IT</option>
            </select>

            {/* year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-[#50765F] rounded-lg px-3 py-1"
            >
              {["Y1S2", "Y2S2", "Y3S2", "Y4S2"].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              className="bg-[#50765F] p-1 rounded-lg w-7 h-7 flex justify-center items-center relative"
              onClick={() => setShowNotification(!showNotification)}
            >
              <IoMdNotificationsOutline className="relative w-6 h-6 text-slate-300" />
              {showNotification ? (
                <div className="absolute bg-green-400 w-3 h-3 rounded-full top-[-3px] ml-5"></div>
              ) : null}
            </button>
            {showNotification ? null : <Notification />}
          </div>

          <div>
            <button className="bg-[#50765F] border border-gray-700 p-1 rounded-lg flex justify-center items-center">
              <BsFileEarmarkText className="relative text-lg ml-1 mr-1 text-slate-300" />
              <span className=" mr-1 text-base text-slate-300">
                {registrationNumber}
              </span>
            </button>
          </div>
          <div>
            <button
              className="bg-red-500 p-1 rounded-lg flex justify-center items-center"
              onClick={logout}
            >
              <IoIosLogOut className="relative text-lg ml-1 mr-1 text-slate-100" />
              <span className=" mr-1 text-base text-slate-100">LogOut</span>
            </button>
          </div>
        </div>
      </nav>

      {/* timetable grid */}
      <section className="grid my-6 gap-x-0 items-center place-items-center justify-center overflow-x-hidden mx-auto w-full grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        {selectedTimetable &&
          Object.keys(selectedTimetable).map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="flex flex-col justify-center mx-auto place-items-center items-center bg-[#D0DCD0] rounded-lg w-[80%]"
            >
              {selectedTimetable[day][currentTimeOfDay] && (
                <>
                  <div className="flex items-center justify-between p-3 bg-[#50765F] w-full rounded-t-lg">
                    <h2 className="text-xl font-bold">{day}</h2>
                    <span className="font-semibold text-base text-slate-200">
                      {selectedTimetable[day][currentTimeOfDay].course_name}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center mx-auto w-full p-3 ">
                    <div className="flex items-center my-2">
                      <label className="text-black-200 text-base">Unit:</label>
                      <span className="font-bold text-base ml-3">
                        {selectedTimetable[day][currentTimeOfDay].unit}
                      </span>
                    </div>
                    <div className="flex items-center my-2">
                      <label className="text-black-200 text-base">Time:</label>
                      <span className="font-bold text-base ml-3">
                        {selectedTimetable[day][currentTimeOfDay].time}
                      </span>
                    </div>
                    <div className="flex items-center my-2">
                      <label className="text-black-200 text-base">Venue:</label>
                      <span className="font-bold text-base ml-3">
                        {selectedTimetable[day][currentTimeOfDay].venue}
                      </span>
                    </div>
                    <div className="flex items-center my-2">
                      <label className="text-black-200 text-base">
                        Lecturer:
                      </label>
                      <span className="font-bold text-base ml-3">
                        {selectedTimetable[day][currentTimeOfDay].lec}
                      </span>
                    </div>
                    <div className="flex justify-center mx-auto w-full p-3 items-center">
                      {timesOfDay.map((time, index) => (
                        <div
                          key={time}
                          onClick={() => handleItemClick(index, time)}
                          className={`bg-green-500 w-3 h-3 rounded-full mx-1 cursor-pointer ${
                            currentTimeOfDay === time
                              ? "opacity-100"
                              : "opacity-30"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
      </section>
    </main>
  );
};

export default Student;
