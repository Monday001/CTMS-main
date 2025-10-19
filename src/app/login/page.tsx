"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
} from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Logging in...");

    try {
      // Determine credentials based on role
      const credentials =
        role === "STUDENT"
          ? { registrationNumber, password, role }
          : role === "LECTURER"
          ? { employeeNumber, password, role }
          : { email, password, role };

      const response = await axios.post("/api/users/login", credentials);
      const userRole = response.data.role;

      toast.success("Login successful!", { id: loadingToast });

      // Redirect based on role
      if (userRole === "ADMIN") {
        router.push("/Admin");
      } else if (userRole === "LECTURER") {
        router.push("/LecturerDashboard");
      } else if (userRole === "STUDENT") {
        router.push("/Student");
      } else {
        router.push("/"); // fallback
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* Left Section: Image with Green Overlay */}
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
        </Box>
      </Box>

      {/* Right Section: Login Form */}
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
          Sign in to CTMS
        </Typography>

        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Role Selector */}
          <TextField
            select
            label="Role"
            variant="outlined"
            fullWidth
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="">Select Role</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="LECTURER">Lecturer</MenuItem>
            <MenuItem value="STUDENT">Student</MenuItem>
          </TextField>

          {/* Conditional Field */}
          {role === "STUDENT" && (
            <TextField
              label="Registration Number"
              variant="outlined"
              fullWidth
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          )}

          {role === "LECTURER" && (
            <TextField
              label="Employee Number"
              variant="outlined"
              fullWidth
              required
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
            />
          )}

          {role === "ADMIN" && (
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
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
            href="/signup"
            style={{
              color: "#10B981",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Sign up →
          </a>
        </Box>
      </Box>
    </Box>
  );
}
