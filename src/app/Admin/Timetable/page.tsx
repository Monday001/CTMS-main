"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "../Header/page";
import Footer from "../Footer/page";
// import FileUpload from "./components/file-upload";
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import { useState } from "react";
import Table from "./components/table";

const defaultTheme = createTheme();


export default function Timetable() {

  const[loading, setLoading] = useState(false)
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
          width: "80%",
        }}
        className="bg-white flex-col justify-center pt-24 w-full mx-auto"
      >
        <Header category="Page" title="Timetable" />
        {loading ? "use client" : "use server" }
        <FilePond
          server={{
            timeout: 7000,
            process: {
              url: '/api/users/timetable',
              method: 'POST',
              headers: {
                'x-customheader': 'Hello World',
              },
              withCredentials: false,
              onload: (response) => response.key,
              onerror: (response) => response.data,
              ondata: (formData) => {
                formData.append('Hello', 'World');
                return formData;
              },
            },
            fetch: null,
            revert: null,
          }}
        />

        <Table />
        
       
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
