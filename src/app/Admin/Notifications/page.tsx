"use client";
import React, { useEffect } from 'react'
import Header from '../Header/page'
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUser } from 'react-icons/fa6';
import { FaBuilding } from "react-icons/fa";
import { MdClass } from "react-icons/md";
import { IoIosTime } from "react-icons/io";
import { BiSolidDetail } from "react-icons/bi";
import { RiDeleteBin6Line } from 'react-icons/ri';

function Notifications() {
    const [notification, setNotification] = React.useState({
        lecturer: "",
        venue: "",
        unit: "",
        saa: "",
        detail: "",
    });
    const [buttonDisabled, setButtonDisabled] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [getNotification, setGetNotification] = React.useState([])

    const onSend = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/notification", notification);
            console.log("API Response:", response.data);
        } catch (error: any) {
            console.log("Upload failed", error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (notification.lecturer.length > 0 && notification.saa.length > 0 && notification.unit.length > 0 && notification.venue.length > 0 && notification.detail.length > 0) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [notification]);
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
    }, []);

    const handleDeleteNotification = async (id) => {
        try {
            await axios.delete(`/api/users/notification?id=${id}`);
            setGetNotification(notification.filter(notification => notification.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <main className='bg-white w-full pt-24'>
            <Header category="Page" title="Notifications" />
            <div className='flex w-full'>
                <div className='w-[40%] flex flex-col'>
                    <h1 className="text-black font-bold text-lg mb-5">{loading ? "Posting..." : "Add Notification"}</h1>
                    <hr />
                    <div className="flex items-center  border border-gray-600 rounded-full bg-white w-[300px] px-4 mb-4">
                        <FaUser className="text-black  w-5 h-5 ml-1 " />
                        <input
                            className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
                            id="password"
                            type="text"
                            value={notification.lecturer}
                            onChange={(e) => setNotification({ ...notification, lecturer: e.target.value })}
                            placeholder="Lecturer"
                        />
                    </div>
                    <div className="flex items-center  border border-gray-600 rounded-full bg-white w-[300px] px-4 mb-4">
                        <FaBuilding className="text-black  w-5 h-5 ml-1 " />
                        <input
                            className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
                            id="password"
                            type="text"
                            value={notification.venue}
                            onChange={(e) => setNotification({ ...notification, venue: e.target.value })}
                            placeholder="Venue"
                        />
                    </div>
                    <div className="flex items-center  border border-gray-600 rounded-full bg-white w-[300px] px-4 mb-4">
                        <MdClass className="text-black  w-5 h-5 ml-1 " />
                        <input
                            className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
                            id="unit"
                            type="text"
                            value={notification.unit}
                            onChange={(e) => setNotification({ ...notification, unit: e.target.value })}
                            placeholder="Unit"
                        />
                    </div>
                    <div className="flex items-center  border border-gray-600 rounded-full bg-white w-[300px] px-4 mb-4">
                        <IoIosTime className="text-black  w-5 h-5 ml-1 " />
                        <input
                            className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
                            id="saa"
                            type="text"
                            value={notification.saa}
                            onChange={(e) => setNotification({ ...notification, saa: e.target.value })}
                            placeholder="Time"
                        />
                    </div>
                    <div className="flex items-center  border border-gray-600 rounded-full bg-white w-[300px] px-4 mb-4">
                        <BiSolidDetail className="text-black  w-5 h-5 ml-1 " />
                        <input
                            className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
                            id="password"
                            type="textarea"
                            value={notification.detail}
                            onChange={(e) => setNotification({ ...notification, detail: e.target.value })}
                            placeholder="Detail"
                        />
                    </div>
                    <button
                        onClick={onSend}
                        className="p-2 border border-gray-300 bg-blue-800 text-black rounded-full w-[300px] mb-4 focus:outline-none focus:border-gray-600"
                    >
                        Post
                    </button>
                </div>
                <div className='mr-3'>
                    <h1 className='text-black font-bold text-lg mb-5'>Your Notifications</h1>
                    <div className='grid grid-cols-3'>
                        {getNotification.map(notification => (
                            <div key={notification.id} className="p-1 flex-col bg-slate-300 rounded my-1 mx-2">
                                <div className="flex items-center  p-3">
                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <div className='bg-white mr-1 p-1 rounded-lg h-8 w-8 '><FaUser className="text-black  w-4 h-4 ml-1 " /></div>
                                            <div className='flex flex-col ml-1'><h1 className="text-sm font-bold text-black">{notification.lecturer}</h1>
                                                <div className='flex'><span className="text-sm font-bold text-stone-900">{notification.unit}</span>
                                                <span className="text-stone-700 text-sm ml-2 font-poppins">{notification.venue}</span></div>
                                                <p className="text-stone-800 text-sm font-poppins">{notification.detail} @ {notification.saa}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNotification(notification.id)}
                                            className="flex rounded-lg p-2 justify-center align-center place-items-center w-full bg-red-600 text-white"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Notifications
