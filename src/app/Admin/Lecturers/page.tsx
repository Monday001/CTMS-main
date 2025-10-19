"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
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
import { usePageTitle } from "../layout";

const API_URL = "/api/users/lecturer";
const themeColor = "#50765F";
const headerBg = "#D0DCD0";

const getLecturers = async () => {
  try {
    const response = await axios.get(API_URL);
    return Array.isArray(response.data)
      ? response.data.map((lecturer) => ({
          id: lecturer.id,
          firstname: lecturer.firstname,
          lastname: lecturer.lastname,
          email: lecturer.email,
          employeeNumber: lecturer.employeeNumber,
        }))
      : [];
  } catch (error: any) {
    console.error("Failed to fetch lecturers", error.message);
    toast.error(error.message);
    return [];
  }
};

// "Add Lecturer" button
function EditToolbar({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-start", p: 1 }}>
      <Button
        startIcon={<AddIcon sx={{ color: "white" }} />}
        onClick={onAddClick}
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
        Add Lecturer
      </Button>
    </Box>
  );
}

export default function LecturersPage() {
  const { setTitle } = usePageTitle();
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    employeeNumber: "",
  });

  useEffect(() => setTitle("Lecturers"), [setTitle]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getLecturers();
      setRows(data);
    };
    fetchData();
  }, []);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleAddClick = () => {
    setFormData({ firstname: "", lastname: "", email: "", password: "", employeeNumber: "" });
    setEditingId(null);
    setOpen(true);
  };

  const handleEditClick = (id: GridRowId) => {
    const lecturer = rows.find((row) => row.id === id);
    if (!lecturer) return;
    setFormData({
      firstname: lecturer.firstname,
      lastname: lecturer.lastname,
      email: lecturer.email,
      password: "",
      employeeNumber: lecturer.employeeNumber,
    });
    setEditingId(String(id));
    setOpen(true);
  };

  const handleDeleteClick = (id: GridRowId) => () => {
    setDeleteId(String(id));
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setRows(rows.filter((row) => row.id !== deleteId));
      toast.success("Lecturer deleted");
    } catch (error) {
      console.error("Failed to delete lecturer", error);
      toast.error("Failed to delete lecturer");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleSaveLecturer = async () => {
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          employeeNumber: formData.employeeNumber,
        });
        toast.success("Lecturer updated!");
      } else {
        await axios.post(API_URL, formData);
        toast.success("Lecturer created!");
      }

      setOpen(false);
      setEditingId(null);
      setFormData({ firstname: "", lastname: "", email: "", password: "", employeeNumber: "" });

      const data = await getLecturers();
      setRows(data);
    } catch (error) {
      console.error("Failed to save lecturer", error);
      toast.error("Failed to save lecturer");
    }
  };

  const columns: GridColDef[] = [
    { field: "firstname", headerName: "First Name", flex: 1 },
    { field: "lastname", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "employeeNumber", headerName: "Employee Number", flex: 1 },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 0.8,
      getActions: ({ id }) => [
        <GridActionsCellItem
          icon={<EditIcon sx={{ color: themeColor }} />}
          label="Edit"
          onClick={() => handleEditClick(id)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon sx={{ color: themeColor }} />}
          label="Delete"
          onClick={handleDeleteClick(id)}
        />,
      ],
    },
  ];

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          height: "calc(100vh - 150px)",
          px: 2,
          pt: 2,
          display: "flex",
          justifyContent: "center",
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
            slotProps={{ toolbar: { onAddClick: handleAddClick } }}
            sx={{
              backgroundColor: "transparent",
              border: "none",
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #e0e0e0",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: headerBg,
                fontWeight: "bold",
                fontSize: "0.95rem",
                color: "#333",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: `${themeColor}10`,
              },
            }}
          />
        </Box>
      </Box>

      {/* Add/Edit Lecturer Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: 6 },
        }}
      >
        <DialogTitle
          sx={{
            color: themeColor,
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          {editingId ? "Edit Lecturer" : "Add Lecturer"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField label="First Name" value={formData.firstname} onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
          <TextField label="Last Name" value={formData.lastname} onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
          <TextField label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          {!editingId && <TextField label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}
          <TextField label="Employee Number" value={formData.employeeNumber} onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" sx={{ borderColor: themeColor, color: themeColor }} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLecturer}
            variant="contained"
            sx={{ backgroundColor: themeColor, "&:hover": { backgroundColor: "#3f5f4b" } }}
            disabled={
              !formData.firstname ||
              !formData.lastname ||
              !formData.email ||
              (!editingId && !formData.password) ||
              !formData.employeeNumber
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
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: 6 },
        }}
      >
        <DialogTitle sx={{ color: themeColor, fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this lecturer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" sx={{ borderColor: themeColor, color: themeColor }} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
