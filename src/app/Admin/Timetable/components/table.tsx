"use client"
import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { toast } from "react-hot-toast";
import React, { useEffect, useState } from "react";

const defaultTheme = createTheme();

const getUsers = async () => {
  try {
    const response = await axios.get("/api/users/timetable");
    toast.success('User exists');

    // Assuming response.data is an array of users
    const transformedTimetable = Array.isArray(response.data)
      ? response.data.map(timetables => ({
        id: timetables._id,
        name: timetables.name,
        size: timetables.size,
        type: timetables.type,
        lastModified: timetables.lastModified,
      }))
      : [];
    console.log(transformedTimetable)

    return transformedTimetable;

  } catch (error: any) {
    console.error("Failed to fetch Timetables", error.message);
    toast.error(error.message);
    return [];
  }
};

const sendDocumentToStudents = async (id: string) => {
  try {
    await axios.post(`/api/users/send?id=${id}`);
    toast.success('Document sent to students successfully');
  } catch (error: any) {
    console.error('Error sending document to students:', error);
    toast.error('Failed to send document to students');
  }
};

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "name", headerName: "Name", width: 150, editable: true },
  { field: "size", headerName: "Size", type: "number", width: 150, editable: true },
  {
    field: "type", headerName: "Type", type: "number", width: 150, editable: true,
  },
  { field: "lastModified", headerName: "Last Modified", type: "number", width: 150, editable: true },
];

export default function Table() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await getUsers();
      setUsers(usersData);
      console.log(usersData)
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (id: any) => {
    try {
      await axios.delete(`/api/users/timetable?id=${id}`);
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      console.log(updatedUsers)
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
        className="bg-white flex-col justify-center pt-8 w-full mx-auto"
      >
        <DataGrid
          rows={users}
          columns={columns.concat({
            field: "actions",
            headerName: "Actions",
            width: 200,
            renderCell: (params) => (
              <div className="flex w-full justify-evenly">
                <button onClick={() => handleDeleteUser(params.row.id)} className="bg-red-600 p-1 rounded text-white">
                  Delete
                </button>
                <button onClick={() => sendDocumentToStudents(params.row.id)} className="bg-green-600 p-1 rounded text-white">
                  Post
                </button>
              </div>
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
      </Box>

    </ThemeProvider>
  );
}
