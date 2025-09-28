"use client";
import Image from "next/image";
import { registerLicense } from "@syncfusion/ej2-base";
import Link from "next/link";
import { HiOutlineArrowLongRight } from "react-icons/hi2";
import sheduler from "../../public/sheduler.jpg";
import admin from "../../public/admin.jpg";
import { useEffect, useState } from 'react';
import axios from 'axios';

registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NHaF5cWWdCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdgWH5feXRVRGFeWE1yV0M="
);

export default function Home() {
  const [studentCount, setStudentCount] = useState(0);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [pdfCount, setPdfCount] = useState(0);

  const fetchPdfCount = async () => {
    try {
      const res = await axios.get('/api/users/pdfCount');
      setPdfCount(res.data.pdfCount);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchStudentCount = async () => {
    try {
      const res = await axios.get('/api/users/stdCount');
      console.log(res)
      setStudentCount(res.data.studentCount);
    } catch (error) {
      console.error(error);
    }
  };
  const fetchLecturerCount = async () => {
    try {
      const res = await axios.get('/api/users/lecCount');
      setLecturerCount(res.data.lecturerCount);
    } catch (error) {
      console.error(error);
    }
  };




  useEffect(() => {
    fetchPdfCount();
    fetchStudentCount();
    fetchLecturerCount();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-[#D0DCD0]">
      <main className="w-full relative flex flex-col mx-auto overflow-x-hidden justify-center">
        <nav className="flex justify-around items-center mx-auto p-4 w-[100%] bg-[#50765F]">
          <header className="text-lg font-bold text-black font-poppins">CTMS</header>
          <div className="flex justify-between w-[40%]">
            <Link
              href="/login"
              className="w-[200px] rounded-full p-2 text-black flex justify-center mx-auto items-center place-items-center my-2 border border-[#D0DCD0] hover:bg-[#D0DCD0] hover:text-black"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="w-[200px] rounded-full p-2 flex justify-center mx-auto items-center place-items-center my-2 bg-blue-600 text-white hover:bg-white hover:text-black"
            >
              Register
            </Link>
          </div>
        </nav>
        <section className="mt-7 py-8 flex place-items-center items-center w-[90vw] mx-auto justify-center">
          <div className="w-[40%] flex flex-col mx-auto">
            <h1 className="font-bold text-stone-800 text-5xl mb-3 font-poppins">
              Welcome to CTMS
            </h1>
            <span className="text-base text-stone-700 leading-9">
              Empower your academic journey with the Classmate Timetable
              Management System – where efficiency meets organization. Say
              goodbye to scheduling chaos and hello to seamless class planning.
              Revolutionize your timetable experience today!
            </span>
          </div>
          <div className="flex justify-evenly w-[50%] mx-auto place-items-center">
            <div className="bg-white rounded-sm w-[280px]">
              <div className="bg-green-300 w-full rounded-t-sm h-40">
                <Image
                  className="object-contain"
                  src={sheduler}
                  alt="sheduler"
                />
              </div>
              <div className="flex-col my-5">
                <div className="p-2">
                  <h2 className="text-lg font-semibold font-poppins">
                    Student's Page
                  </h2>
                  <p className="font-poppins text-sm text-stone-600 ">
                    Get Updated on timely schedules for your classes, cats and
                    exams
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-[90%] rounded-full p-2 flex justify-center mx-auto items-center place-items-center my-2 border border-blue-600 text-black hover:bg-blue-600 hover:text-white"
                >
                  Take A Look <HiOutlineArrowLongRight className="ml-2" />
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-sm w-[280px]">
              <div className="bg-green-300 w-full rounded-t-sm h-40">
                <Image className="object-contain" src={admin} alt="sheduler" />
              </div>
              <div className="flex-col my-5">
                <div className="p-2">
                  <h2 className="text-lg font-semibold font-poppins">
                    Moderator's Page
                  </h2>
                  <p className="font-poppins text-sm text-stone-600 ">
                    Restricted access to authorized personel only.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-[90%] rounded-full p-2  flex justify-center mx-auto items-center place-items-center my-2 border border-blue-600 hover:bg-blue-600 text-black hover:text-white"
                >
                  Get Verified <HiOutlineArrowLongRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="bg-white h-20 rounded p-6 flex fixed left-0 right-0 mx-auto justify-evenly w-[80%] bottom-0 ">
        <div className="flex">
          <span className="text-4xl text-blue-400 mr-2">{pdfCount}</span>
          <h3 className="text-sm text-stone-600 font-semibold font-poppins">
            Learning <br /> Institutions
          </h3>
        </div>
        <div className="h-[80%] flex justify-center w-[2px] bg-slate-400"></div>
        <div className="flex">
          <span className="text-4xl text-blue-400 mr-2">{studentCount}</span>
          <h3 className="text-sm text-stone-600 font-semibold font-poppins">
            Learning <br /> Students
          </h3>
        </div>
        <div className="h-[80%] flex justify-center w-[2px] bg-slate-400"></div>
        <div className="flex">
          <span className="text-4xl text-blue-400 mr-2">{lecturerCount}</span>
          <h3 className="text-sm text-stone-600 font-semibold font-poppins">
            Administrative <br /> Moderators
          </h3>
        </div>
      </section>
    </div>
  );
}
