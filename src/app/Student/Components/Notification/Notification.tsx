"use client";
import { IoClose } from "react-icons/io5";

import { useEffect, useState } from "react";
import axios from "axios";
import { FaUser } from "react-icons/fa6";


const Notification = () => {
  const [showNotification, setShowNotification] = useState(true);

  const [noteCount, setNoteCount] = useState(0);
  const [getNotification, setGetNotification] = useState([])
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/users/notification');
      // const note = setGetNotification(response.data.notifications);
      console.log(response)
      const notify = Array.isArray(response.data)
        ? response.data.map(notification => ({
          id: notification._id,
          lecturer: notification.lecturer,
          venue: notification.venue,
          unit: notification.unit,
          saa: notification.saa,
          detail: notification.detail,
        }))
        : [];
      console.log(notify)
      return notify;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchLecturerCount = async () => {
    try {
      const res = await axios.get('/api/users/noteCount');
      setNoteCount(res.data.noteCount);
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    const fetchAndSetNotifications = async () => {
      try {
        const note = await fetchData();
        setGetNotification(note);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchAndSetNotifications();
    fetchLecturerCount();
  }, []);


  function markAllAsRead(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className={`absolute top-20 z-50 ${showNotification ? 'block' : 'hidden'}`}>
      <main className="bg-white rounded-lg shadow-lg w-80">
        <div className="flex items-center justify-between px-4 py-2 bg-blue-100 rounded-t-lg">
          <div className="flex justify-center ">
            <span className="mr-2 text-stone-800 font-semibold">{noteCount}</span>
            <h1 className="text-black font-bold">Notifications</h1>
          </div>
          <button onClick={() => setShowNotification(false)}>
            <IoClose className="text-black" />
          </button>
        </div>
        <div className="my-1">
          {getNotification.map(notification => (
            <div key={notification.id} className="p-1 flex bg-slate-300 rounded my-1 mx-2 hover:mx-0">
              <div className="flex items-center">
                <div className="ml-2 flex flex-col">
                  <div className="flex">
                    <div className='bg-white mr-1 p-1 rounded-lg h-8 w-8 '><FaUser className="text-black  w-4 h-4 ml-1 " /></div>
                    <div className='flex flex-col ml-1'><h1 className="text-sm font-bold text-black">{notification.lecturer}</h1>
                      <div className='flex'><span className="text-sm font-bold text-stone-900">{notification.unit}</span>
                        <span className="text-stone-700 text-sm ml-2 font-poppins">{notification.venue}</span></div>
                      <p className="text-stone-800 text-sm font-poppins">{notification.detail} @ {notification.saa}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="py-2 bg-blue-200 rounded-b-lg text-center">
          <h1 className="text-sm font-semibold text-gray-600 hover:text-gray-800 cursor-pointer">
            CTMS
          </h1>
        </div>
      </main>
    </div>
  );
};

export default Notification;
