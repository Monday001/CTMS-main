"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = React.useState({
    email: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", user);
      console.log("API Response:", response.data);
      const role = response.data.role;
      console.log("Login success", response.data.role)

      if (role === "ADMIN") {
        router.push("/Admin");
        toast.success("Welcome, Admin Login success");
      } else if (role === "STUDENT") {
        router.push("/Student");
        toast.success("Welcome, Student Login success");
      } else {
        router.push("/login");
        toast.success("Sorry, Login Failed");
      }
    } catch (error: any) {
      console.log("Login failed", error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.email.length > 0 && user.password.length > 0) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#50765F]">
      <h1 className="text-black font-bold text-5xl mb-5">{loading ? "Processing" : "Sign in to CTMS"}</h1>
      <hr />

      <div className="flex items-center  border border-gray-300 rounded-full bg-white w-[300px] px-4 mb-4">
        <MdEmail className="text-black  w-5 h-5 ml-1 " />
        <input
          className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
          id="email"
          type="text"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email"
        />
      </div>
      <div className="flex items-center  border border-gray-300 rounded-full bg-white w-[300px] px-4 mb-4">
        <RiLockPasswordFill className="text-black  w-5 h-5 ml-1 " />
        <input
          className="p-2 rounded-lg focus:outline-none focus:border-gray-600 text-black"
          id="password"
          type="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="Password"
        />
      </div>
      <button
        onClick={onLogin}
        className="p-2 border border-gray-300 rounded-full w-[300px] mb-4 focus:outline-none focus:border-gray-600"
      >
        Login here
      </button>
      <Link href="/signup" className="font-semibold">Visit Signup page</Link>
      <Link href="/" className="font-semibold text-green-500">Home</Link>
    </div>
  );
}
