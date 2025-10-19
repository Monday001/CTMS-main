"use client";
import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import ChartsOverviewDemo from "./Graph/page";
import StudentCount from "./StudentCount";
import TimetableCount from "./TimetableCount";
import Aparol from "./CourseCount";
import LecturerCount from "./LecturerCount";
import CourseDistributionGraph from "./CourseDistributionGraph";
import { usePageTitle } from "./layout";
import CourseCount from "./CourseCount";

const defaultTheme = createTheme();

export default function Dashboard() {
  const { setTitle } = usePageTitle();

  React.useEffect(() => {
    setTitle("Dashboard");
  }, [setTitle]);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }} className="w-full bg-white">
        <CssBaseline />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }}>
            <Grid container spacing={3}>
              {/* ✅ Timetable Card (custom-styled) */}
              <Grid item xs={12} md={6} lg={3}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl items-center space-x-4 hover:shadow-md transition h-[120px]">
                  <TimetableCount />
                </div>
              </Grid>

              {/* Lecturer */}
              <Grid item xs={12} md={6} lg={3}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl items-center space-x-4 hover:shadow-md transition h-[120px]">
                  <LecturerCount />
                </div>
              </Grid>

              {/* Students */}
              <Grid item xs={12} md={6} lg={3}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl items-center space-x-4 hover:shadow-md transition h-[120px]">
                  <StudentCount />
                </div>
              </Grid>

              {/* Courses */}
              <Grid item xs={12} md={6} lg={3}>
                <div className="p-5 bg-[#D0DCD0] shadow rounded-xl items-center space-x-4 hover:shadow-md transition h-[120px]">
                  <CourseCount />
                </div>
              </Grid>

              {/* Chart */}
              <Grid item xs={12}>
                <CourseDistributionGraph />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
