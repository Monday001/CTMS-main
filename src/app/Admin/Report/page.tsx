"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Button,
  Modal,
  TextField,
  MenuItem,
  Typography,
  CssBaseline,
  Container,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { usePageTitle } from "../layout";
import CourseDistributionGraph from "../CourseDistributionGraph";
import { FaUniversity, FaBookOpen, FaUserTie } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const theme = createTheme();
const themeColor = "#50765F";

// ✅ Official Murang'a University Faculties (fallback)
const FALLBACK_DEPARTMENTS = [
  "School of Computing & Information Technology",
  "School of Business & Economics",
  "School of Agriculture & Environmental Sciences",
  "School of Engineering & Technology",
  "School of Hospitality & Tourism Management",
  "School of Pure, Applied & Health Sciences",
  "School of Nursing & Health Sciences",
  "School of Natural Resources & Environmental Studies",
  "School of Arts & Design",
];

interface Course {
  id: number;
  department: string;
  courseName: string;
  courseCode: string;
}

interface CourseResponse {
  success: boolean;
  courses: Course[];
}

interface LecturerResponse {
  lecturerCount: number;
}

export default function Reports() {
  const { setTitle } = usePageTitle();

  // Counts
  const [departmentCount, setDepartmentCount] = useState<number>(0);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [lecturerCount, setLecturerCount] = useState<number>(0);

  // Animated display counts
  const [displayedDept, setDisplayedDept] = useState(0);
  const [displayedCourse, setDisplayedCourse] = useState(0);
  const [displayedLecturer, setDisplayedLecturer] = useState(0);

  // Modal + form state
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    courseName: "",
    courseCode: "",
  });

  const [departments, setDepartments] = useState<string[]>(FALLBACK_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [refreshGraphKey, setRefreshGraphKey] = useState(0);

  useEffect(() => {
    setTitle("Reports & Insights");
  }, [setTitle]);

  // ✅ Fetch courses, lecturers, and update counts/departments
  const fetchCounts = async () => {
    try {
      setLoading(true);

      const [courseRes, lecturerRes] = await Promise.all([
        axios
          .get<CourseResponse>("/api/users/courses")
          .catch(() => ({ data: { success: false, courses: [] } })),
        axios
          .get<LecturerResponse>("/api/users/lecCount")
          .catch(() => ({ data: { lecturerCount: 0 } })),
      ]);

      let uniqueDepartments: string[] = [];
      let allCourses: Course[] = [];

      if (courseRes.data.success) {
        allCourses = courseRes.data?.courses ?? [];

        uniqueDepartments = Array.from(
          new Set(
            allCourses.map((c) => c.department?.trim()).filter(Boolean)
          )
        ) as string[];
      }

      // ✅ Merge DB + fallback departments
      const mergedDepartments = Array.from(
        new Set([...FALLBACK_DEPARTMENTS, ...uniqueDepartments])
      );

      setDepartments(mergedDepartments);
      setDepartmentCount(mergedDepartments.length);
      setCourseCount(allCourses.length);

      // Lecturer count
      setLecturerCount(lecturerRes.data?.lecturerCount ?? 0);
    } catch (err) {
      console.error("Error fetching counts:", err);
      toast.error("Failed to fetch data, using fallback.");
      setDepartments(FALLBACK_DEPARTMENTS);
      setDepartmentCount(FALLBACK_DEPARTMENTS.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // ✅ Smooth animated number transitions
  const animateCount = (target: number, setter: React.Dispatch<React.SetStateAction<number>>) => {
    const duration = 800;
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      setter(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => animateCount(departmentCount, setDisplayedDept), [departmentCount]);
  useEffect(() => animateCount(courseCount, setDisplayedCourse), [courseCount]);
  useEffect(() => animateCount(lecturerCount, setDisplayedLecturer), [lecturerCount]);

  // ✅ Modal handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ department: "", courseName: "", courseCode: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Add Course (prevents duplicates server-side)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department || !formData.courseName || !formData.courseCode) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await axios.post("/api/users/courses", formData);
      if (res.data.success) {
        toast.success("Course added successfully!");
        handleClose();
        await fetchCounts(); // Refresh counts & departments
        setRefreshGraphKey((k) => k + 1); // Refresh chart
      } else {
        toast.error(res.data.error || "Failed to add course");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to add course");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          backgroundColor: (t) =>
            t.palette.mode === "light" ? t.palette.grey[100] : t.palette.grey[900],
          flexGrow: 1,
          minHeight: "100vh",
          overflow: "auto",
        }}
        className="pt-8 pb-10"
      >
        <Container maxWidth="lg">
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt={10}
              color="#50765F"
            >
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Departments */}
              <Grid item xs={12} md={4}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl flex items-center justify-between h-[120px]">
                  <div>
                    <Typography
                      variant="subtitle1"
                      className="text-[#50765F] font-semibold flex items-center gap-2"
                    >
                      <FaUniversity className="text-[#50765F]" /> Departments
                    </Typography>
                    <Typography
                      variant="h4"
                      className="font-extrabold text-stone-700 mt-1"
                    >
                      {displayedDept}
                    </Typography>
                  </div>
                </div>
              </Grid>

              {/* Courses */}
              <Grid item xs={12} md={4}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl flex items-center justify-between h-[120px]">
                  <div>
                    <Typography
                      variant="subtitle1"
                      className="text-[#50765F] font-semibold flex items-center gap-2"
                    >
                      <FaBookOpen className="text-[#50765F]" /> Courses
                    </Typography>
                    <Typography
                      variant="h4"
                      className="font-extrabold text-stone-700 mt-1"
                    >
                      {displayedCourse}
                    </Typography>
                  </div>
                </div>
              </Grid>

              {/* Lecturers */}
              <Grid item xs={12} md={4}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl flex items-center justify-between h-[120px]">
                  <div>
                    <Typography
                      variant="subtitle1"
                      className="text-[#50765F] font-semibold flex items-center gap-2"
                    >
                      <FaUserTie className="text-[#50765F]" /> Lecturers
                    </Typography>
                    <Typography
                      variant="h4"
                      className="font-extrabold text-stone-700 mt-1"
                    >
                      {displayedLecturer}
                    </Typography>
                  </div>
                </div>
              </Grid>

              {/* Add Course Button */}
              <Grid item xs={12} className="flex justify-end mt-3">
                <Button
                  startIcon={<AddIcon sx={{ color: "white" }} />}
                  onClick={handleOpen}
                  variant="contained"
                  sx={{
                    backgroundColor: themeColor,
                    "&:hover": { backgroundColor: "#3f5f4b" },
                    textTransform: "none",
                    fontWeight: 600,
                    color: "white",
                    borderRadius: "5px",
                    px: 2,
                  }}
                >
                  Add Course
                </Button>
              </Grid>

              {/* Course Distribution Graph */}
              <Grid item xs={12}>
                <CourseDistributionGraph key={refreshGraphKey} />
              </Grid>
            </Grid>
          )}
        </Container>

        {/* Add Course Modal */}
        <Modal open={open} onClose={handleClose}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography
              sx={{ color: "#50765F" }}
              variant="h6"
              textAlign="center"
              fontWeight="bold"
            >
              Add New Course
            </Typography>

            <TextField
              label="Department"
              name="department"
              select
              value={formData.department}
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="">Select Department</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Course Name"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="Course Code"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              required
              fullWidth
            />

            <Box className="flex justify-end gap-3 mt-3">
              <Button onClick={handleClose} sx={{ color: "#50765F" }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: "#50765F" }}>
                Save
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
}
