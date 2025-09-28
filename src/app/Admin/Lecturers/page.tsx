"use client";
import React, { useEffect, useState } from "react";   
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import {
  randomCreatedDate,
  randomTraderName,
  randomId,
  randomArrayItem,
} from "@mui/x-data-grid-generator";
import axios from "axios";
import Header from "../Header/page";
import Footer from "../Footer/page";
import { TextField } from "@mui/material";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const roles = ["Lesson", "HOD", "Development"];
const randomRole = () => {
  return randomArrayItem(roles);
};



const API_URL = "/api/users/lecturer";
const getUsers = async () => {
  try {
    const response = await axios.get("/api/users/lecturer");
    toast.success('User exists');

    // Assuming response.data is an array of users
    const transformedUsers = Array.isArray(response.data)
      ? response.data.map(lecturer => ({
          id: lecturer._id,
          firstname: lecturer.firstname,
          lastname: lecturer.lastname,
          email: lecturer.email,
          password: lecturer.password,
          employeeNumber: lecturer.employeeNumber,
        }))
      : [];
      console.log(transformedUsers )
    return transformedUsers;
    
  } catch (error: any) {
    console.error("Failed to fetch users", error.message);
    toast.error(error.message);
    return [];
  }
};


const initialRows: GridRowsProp = [
  
];

interface EditToolbarProps {
  setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
  setRowModesModel: (
    newModel: (oldModel: GridRowModesModel) => GridRowModesModel
  ) => void;
}

function EditToolbar(props: EditToolbarProps) {
  const router = useRouter();
  

  const { setRows, setRowModesModel } = props;
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    employeeNumber: '',
  });

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: event.target.value,
    }));
  };

  const handleClick = async () => {
    try {
      // Validate your form data if needed

      const response = await axios.post("/api/users/lecturer", formData);
      toast.success('Lecturer created successfully!');
      router.refresh();

    } catch (error: any) {
      console.error('Error creating lecturer:', error.message);
    }
  };

  return (
    <GridToolbarContainer>
      {/* Assuming you have form input fields */}
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
      <TextField
        label="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <TextField
        label="Emp Number"
        value={formData.employeeNumber}
        onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
      />

      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

export default function FullFeaturedCrudGrid() {
  const router = useRouter();
  const [rows, setRows] = React.useState(initialRows);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>(
    {}
  );
  const [lecturer, setLecturer] = useState({
    newFirstName: '',
    newLastName: '',
    newEmail: '',
    newPassword: '',
    newEmployeeNumber: '',
  });

  const [users, setUsers] = useState([]);
  


  useEffect(() => {
    const fetchData = async () => {
      const usersData = await getUsers();
      setUsers(usersData);
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

  const handleEditClick = (id: GridRowId) => async () => {
    try {
      // Assuming you want to fetch additional data before entering edit mode
      const response = await axios.get(`${API_URL}/${id}`);

      setRows((oldRows) => {
        const updatedRows = oldRows.map((row) =>
          row.id === id ? { ...row, ...response.data, isNew: false } : row
        );
        return updatedRows;
      });

      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    } catch (error) {
      console.error("Error fetching lecturer for edit:", error);
    }
  };

  const handleSaveClick = (id: GridRowId) => async () => {
    try {
      const updatedRow = await axios.put(`/api/users/lecturer?id=${id}`, {
        // Assuming you have the updated data available in the row
        firstname: users.find((row) => row._id === id)?.firstname || "",
        lastname: users.find((row) => row._id === id)?.lastname || "",
        email: users.find((row) => row._id === id)?.email || "",
        password: users.find((row) => row._id === id)?.password || "",
        isVerified: users.find((row) => row._id === id)?.isVerified || false,
        employeeNumber:
        users.find((row) => row._id === id)?.employeeNumber || "",
      });
      console.log(updatedData)

      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
      processRowUpdate(updatedRow.data);
    } catch (error) {
      console.error("Error updating lecturer:", error);
    }
  };

  const handleDeleteClick = (id: GridRowId) => async () => {
    try {
      await axios.delete(`/api/users/lecturer?id=${id}`);
      setUsers(users.filter((user) => user._id !== id));
      router.refresh()
    } catch (error) {
      console.error("Error deleting lecturer:", error);
    }
  };

  const handleCancelClick = (id: GridRowId) => async () => {
    try {
      const editedRow = users.find((user) => user._id === id);

      if (editedRow) {
        if (editedRow.isNew) {
          // If it's a newly added row that is canceled, delete it from the server
          await axios.delete(`${API_URL}/${id}`);
        }

        // Update local state to remove the canceled row
        setRows((oldRows) => oldRows.filter((row) => row._id !== id));
      }

      // Set the row mode to view and ignore modifications
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
    } catch (error) {
      console.error("Error handling cancel:", error);
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    { field: "firstname", headerName: "FirstName", width: 180, editable: true },
    { field: "lastname", headerName: "LastName", width: 180, editable: true },
    {
      field: "employeeNumber",
      headerName: "EmployeeNumber",
      width: 200,
      align: "left",
      headerAlign: "left",
      editable: true,
    },
    {
      field: "email",
      headerName: "Email",
      width: 180,
      editable: true,
    },
    {
      field: "password",
      headerName: "Password",
      width: 180,
      editable: true,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 80,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        "& .actions": {
          color: "text.secondary",
        },
        "& .textPrimary": {
          color: "text.primary",
        },
      }}
      className="bg-white flex-col justify-center pt-24 w-full h-full mx-auto"
    >
      <Header category="Page" title="Lecturers" />
      <DataGrid
        rows={ users }
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setRows, setRowModesModel },
        }}
      />
      <Footer />
    </Box>
  );
}
