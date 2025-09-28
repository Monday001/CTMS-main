"use client"
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from '../Header/page';
import Footer from '../Footer/page';
import axios from "axios";
import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";

const defaultTheme = createTheme();

const getUsers = async () => {
  try {
    const response = await axios.get("/api/users/signup");
    toast.success('User exists');

    // Assuming response.data is an array of users
    const transformedUsers = Array.isArray(response.data)
      ? response.data.map(user => ({
          id: user._id,
          userName: user.username,
          email: user.email,
          course: user.course,
          yearOfStudy: user.yearOfStudy,
          regNumber: user.registrationNumber,
        }))
      : [];

    return transformedUsers;
    console.log(transformedUsers )
  } catch (error: any) {
    console.error("Failed to fetch users", error.message);
    toast.error(error.message);
    return [];
  }
};

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "userName", headerName: "Username", width: 150, editable: true },
  { field: "email", headerName: "Email", width: 150, editable: true },
  { field: "course", headerName: "Course", type: "number", width: 150, editable: true, align: 'left',
  headerAlign: 'left'},
  { field: "yearOfStudy", headerName: "Year of Study", type: "number", width: 150, editable: true },
  { field: "regNumber", headerName: "Registration Number", type: "number", width: 150, editable: true },
];

export default function Student() {
  
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await getUsers();
      setUsers(usersData);
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (id: any) => {
    try {
      await axios.delete(`/api/users/signup?id=${id}`);
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

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
          width: "80%"
        }}
        className="bg-white flex-col justify-center pt-24 w-full h-full mx-auto"
      >
        <Header category="Page" title="Students" />
        <DataGrid
          rows={ users }
          columns={columns.concat({
            field: "actions",
            headerName: "Actions",
            width: 120,
            renderCell: (params) => (
              <button onClick={() => handleDeleteUser(params.row.id)}className="bg-red-600 p-1 rounded text-white">
                Delete
              </button>
            )
          })}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
        />
        <Footer />
      </Box>
      
    </ThemeProvider>
  );
}
