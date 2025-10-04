"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowModesModel,
  GridRowEditStopReasons,
  GridRowsProp,
} from "@mui/x-data-grid";
import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { usePageTitle } from "../layout"; // ✅ shared page title context

const API_URL = "/api/users/student";

// 🔹 Fetch students
const getStudents = async () => {
  try {
    const response = await axios.get(API_URL);
    return Array.isArray(response.data)
      ? response.data.map((student) => ({
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          email: student.email,
          course: student.course,
          yearOfStudy: student.yearOfStudy,
          registrationNumber: student.registrationNumber,
        }))
      : [];
  } catch (error: any) {
    console.error("Failed to fetch students", error.message);
    toast.error(error.message);
    return [];
  }
};

// 🔹 Toolbar with "Add Student" button
function EditToolbar({ onAddClick }: { onAddClick: () => void }) {
  return (
    <GridToolbarContainer sx={{ gap: 1, p: 1 }}>
      <Button
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddClick}
        variant="contained"
      >
        Add Student
      </Button>
    </GridToolbarContainer>
  );
}

export default function StudentsPage() {
  const { setTitle } = usePageTitle();
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [open, setOpen] = useState(false); // student form dialog
  const [confirmOpen, setConfirmOpen] = useState(false); // delete confirmation dialog
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    course: "",
    yearOfStudy: "",
    registrationNumber: "",
  });

  // 🔹 Update page title
  useEffect(() => {
    setTitle("Students");
  }, [setTitle]);

  // 🔹 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const students = await getStudents();
      setRows(students);
    };
    fetchData();
  }, []);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  // 🔹 Open dialog for Add
  const handleAddClick = () => {
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      course: "",
      yearOfStudy: "",
      registrationNumber: "",
    });
    setEditingId(null);
    setOpen(true);
  };

  // 🔹 Open dialog for Edit
  const handleEditClick = (id: GridRowId) => {
    const student = rows.find((row) => row.id === id);
    if (student) {
      setFormData({
        firstname: student.firstname,
        lastname: student.lastname,
        email: student.email,
        password: "", // password not editable
        course: student.course,
        yearOfStudy: student.yearOfStudy,
        registrationNumber: student.registrationNumber,
      });
      setEditingId(String(id));
      setOpen(true);
    }
  };

  // 🔹 Open confirm dialog for Delete
  const handleDeleteClick = (id: GridRowId) => () => {
    setDeleteId(String(id));
    setConfirmOpen(true);
  };

  // 🔹 Confirm delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setRows(rows.filter((row) => row.id !== deleteId));
      toast.success("Student deleted");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  // 🔹 Save (Add or Update)
  const handleSaveStudent = async () => {
    try {
      if (editingId) {
        // Update
        await axios.put(`${API_URL}/${editingId}`, {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          course: formData.course,
          yearOfStudy: formData.yearOfStudy,
          registrationNumber: formData.registrationNumber,
        });
        toast.success("Student updated!");
      } else {
        // Create
        await axios.post(API_URL, formData);
        toast.success("Student created!");
      }

      setOpen(false);
      setEditingId(null);
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        course: "",
        yearOfStudy: "",
        registrationNumber: "",
      });

      // refresh
      const students = await getStudents();
      setRows(students);
    } catch (error: any) {
      toast.error("Failed to save student");
    }
  };

  // 🔹 Columns
  const columns: GridColDef[] = [
    { field: "firstname", headerName: "First Name", flex: 1 },
    { field: "lastname", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "course", headerName: "Course", flex: 1 },
    { field: "yearOfStudy", headerName: "Year of Study", flex: 1 },
    { field: "registrationNumber", headerName: "Reg. Number", flex: 1.2 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 0.8,
      getActions: ({ id }) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditClick(id)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDeleteClick(id)}
          color="inherit"
        />,
      ],
    },
  ];

  return (
    <>
      {/* 🔹 DataGrid */}
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          height: "calc(100vh - 150px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          px: 2,
          pt: 2,
        }}
      >
        <Box sx={{ flexGrow: 1, maxWidth: "1200px", width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={setRowModesModel}
            onRowEditStop={handleRowEditStop}
            slots={{ toolbar: EditToolbar }}
            slotProps={{
              toolbar: { onAddClick: handleAddClick },
            }}
            sx={{
              backgroundColor: "transparent",
              border: "none",
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #e0e0e0",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
              },
            }}
          />
        </Box>
      </Box>

      {/* Student Form Dialog (Add/Edit) */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
        >
          <TextField
            label="First Name"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
          />
          <TextField
            label="Last Name"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
          />
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {!editingId && (
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
          <TextField
            label="Course"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
          />
          <TextField
            label="Year of Study"
            type="number"
            value={formData.yearOfStudy}
            onChange={(e) =>
              setFormData({ ...formData, yearOfStudy: e.target.value })
            }
          />
          <TextField
            label="Registration Number"
            value={formData.registrationNumber}
            onChange={(e) =>
              setFormData({ ...formData, registrationNumber: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveStudent}
            variant="contained"
            disabled={
              !formData.firstname ||
              !formData.lastname ||
              !formData.email ||
              (!editingId && !formData.password) || // password required only when creating
              !formData.course ||
              !formData.yearOfStudy ||
              !formData.registrationNumber
            }
          >
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this student? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
