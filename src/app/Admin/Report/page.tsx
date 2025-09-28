"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "../Header/page";
import Footer from "../Footer/page";
import Paper from "@mui/material/Paper";
import { Grid } from "@mui/material";
import Chart from "../Graph/page";

const defaultTheme = createTheme();

export default function Report() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100%",
          overflow: "auto",
          flexDirection: "column",
        }}
        className="bg-white flex justify-center pt-24 w-[90%] mx-auto"
      >
        <Header category="Page" title="Report" />
        <Grid item xs={12} md={8} lg={9}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 565,
            }}
          >
            <Chart />
          </Paper>
        </Grid>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
