"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
} from "@mui/material";

export default function SignupPage() {
  const router = useRouter();
  const [adminExists, setAdminExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const previousCourses = useRef<string[]>([]);

  const [user, setUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "",
    yearOfStudy: "",
    course: "",
    registrationNumber: "",
    employeeNumber: "",
  });

  // ✅ Fetch all courses
  const fetchCourses = async (showToast = false) => {
    try {
      const res = await axios.get("/api/users/courses");
      if (res.data?.success && res.data?.courses?.length > 0) {
        const fetchedCourses = res.data.courses.map(
          (c: any) => c.course_name
        );

        // Detect newly added courses
        const newCourses = fetchedCourses.filter(
          (course: string) => !previousCourses.current.includes(course)
        );

        // If new course detected
        if (newCourses.length > 0 && showToast) {
          toast.success(
            `${newCourses.length} new course${
              newCourses.length > 1 ? "s" : ""
            } added.`
          );
        }

        setCourses(fetchedCourses);
        previousCourses.current = fetchedCourses;
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
    } finally {
      setCourseLoading(false);
    }
  };

  // ✅ Initial course fetch
  useEffect(() => {
    fetchCourses();
  }, []);

  // ✅ Auto-refresh courses every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCourses(true);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  // ✅ Check if admin exists
  useEffect(() => {
    axios.get("/api/users/check-admin").then((res) => {
      setAdminExists(res.data.exists);
    });
  }, []);

  // ✅ Handle signup
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
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Left Section */}
      <Box
        sx={{
          width: "50%",
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `
            linear-gradient(to right, #50765F, rgba(255, 255, 255, 1)),
            url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#50765F",
          textAlign: "center",
          px: 4,
        }}
      >
        <Box sx={{ maxWidth: 480 }}>
          <Typography variant="h3" fontWeight="bold" mb={2}>
            Welcome to CTMS
          </Typography>
          <Typography variant="body1" fontSize="1.1rem">
            Manage your classes, stay organized, and access your academic
            information in one place.
          </Typography>
          <Typography variant="body1" fontSize="1.1rem" mt={2}>
            Create an account to get started.
          </Typography>
        </Box>
      </Box>

      {/* Right Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          p: 4,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          color="#50765F"
          mb={4}
        >
          Sign up to CTMS
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            required
            value={user.firstname}
            onChange={(e) => setUser({ ...user, firstname: e.target.value })}
          />

          <TextField
            label="Last Name"
            variant="outlined"
            fullWidth
            required
            value={user.lastname}
            onChange={(e) => setUser({ ...user, lastname: e.target.value })}
          />

          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            required
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />

          <TextField
            select
            label="Role"
            variant="outlined"
            fullWidth
            required
            value={user.role}
            onChange={(e) => setUser({ ...user, role: e.target.value })}
          >
            <MenuItem value="">Select Role</MenuItem>
            <MenuItem value="STUDENT">Student</MenuItem>
            <MenuItem value="LECTURER">Lecturer</MenuItem>
            {!adminExists && <MenuItem value="ADMIN">Admin</MenuItem>}
          </TextField>

          {/* Student Fields */}
          {user.role === "STUDENT" && (
            <>
              <TextField
                label="Registration Number"
                variant="outlined"
                fullWidth
                required
                value={user.registrationNumber}
                onChange={(e) =>
                  setUser({ ...user, registrationNumber: e.target.value })
                }
              />

              <TextField
                select
                label="Course"
                variant="outlined"
                fullWidth
                required
                value={user.course}
                onChange={(e) =>
                  setUser({ ...user, course: e.target.value })
                }
                disabled={courseLoading}
              >
                {courseLoading ? (
                  <MenuItem disabled>Loading courses...</MenuItem>
                ) : courses.length > 0 ? (
                  courses.map((course, idx) => (
                    <MenuItem key={idx} value={course}>
                      {course}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No courses available</MenuItem>
                )}
              </TextField>

              <TextField
                label="Year of Study"
                variant="outlined"
                fullWidth
                required
                value={user.yearOfStudy}
                onChange={(e) =>
                  setUser({ ...user, yearOfStudy: e.target.value })
                }
              />
            </>
          )}

          {/* Lecturer Fields */}
          {user.role === "LECTURER" && (
            <TextField
              label="Employee Number"
              variant="outlined"
              fullWidth
              required
              value={user.employeeNumber}
              onChange={(e) =>
                setUser({ ...user, employeeNumber: e.target.value })
              }
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1,
              backgroundColor: "#50765F",
              "&:hover": { backgroundColor: "#059669" },
              color: "white",
              fontWeight: "bold",
              py: 1.2,
              borderRadius: "10px",
              textTransform: "none",
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
          </Button>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            fontSize: "0.9rem",
          }}
        >
          <a
            href="/"
            style={{
              color: "#10B981",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            ← Back to Home
          </a>

          <a
            href="/login"
            style={{
              color: "#10B981",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Login →
          </a>
        </Box>
      </Box>
    </Box>
  );
}
