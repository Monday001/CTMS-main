"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [adminExists, setAdminExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    yearOfStudy: "",
    course: "",
    registrationNumber: "",
    employeeNumber: "",
  });

  // 🔹 Check if admin already exists
  useEffect(() => {
    axios.get("/api/users/check-admin").then((res) => {
      setAdminExists(res.data.exists);
    });
  }, []);

  // 🔹 Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loadingToast = toast.loading("Creating your account...");

    try {
      await axios.post("/api/users/signup", user);

      toast.success("Signup successful! Redirecting to login…", {
        id: loadingToast,
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500); // wait 1.5s so user sees success message
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 w-[350px]"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>

        {/* Username */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            required
          />
        </div>

        {/* Role Dropdown */}
        <div className="mb-4">
          <select
            className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
            required
          >
            <option value="">Select Role</option>
            <option value="STUDENT">Student</option>
            <option value="LECTURER">Lecturer</option>
            {!adminExists && <option value="ADMIN">Admin</option>}
          </select>
        </div>

        {/* Student Fields */}
        {user.role === "STUDENT" && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Registration Number"
                className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
                value={user.registrationNumber}
                onChange={(e) =>
                  setUser({ ...user, registrationNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Course"
                className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
                value={user.course}
                onChange={(e) => setUser({ ...user, course: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Year of Study"
                className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
                value={user.yearOfStudy}
                onChange={(e) =>
                  setUser({ ...user, yearOfStudy: e.target.value })
                }
                required
              />
            </div>
          </>
        )}

        {/* Lecturer Fields */}
        {user.role === "LECTURER" && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Employee Number"
              className="border border-gray-300 rounded-lg w-full py-2 px-3 text-black"
              value={user.employeeNumber}
              onChange={(e) =>
                setUser({ ...user, employeeNumber: e.target.value })
              }
              required
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 mt-4 rounded-lg text-white ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {/* Back to login */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-blue-500 hover:underline font-medium"
          >
            Back to Login
          </button>
        </p>
      </form>
    </div>
  );
}
