"use client";
import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, IconButton, Typography, Button, Collapse, Tooltip, TextField, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoMdAddCircleOutline } from "react-icons/io";
import toast from "react-hot-toast";
import axios from "axios";
import { usePageTitle } from "../layout";
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from "@mui/material";

const themeColor = "#50765F";
const secondaryColor = "#D0DCD0";

interface Notification {
  id: string;
  title: string;
  message: string;
  recipient_type: string;
  target_scope: string;
  course?: string;
  year?: string;
  target_id?: string;
  status: "UNREAD" | "READ";
}

const API_URL = "/api/users/notification";

export default function NotificationsPage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    recipient_type: "STUDENT",
    target_scope: "ALL",
    course: "",
    year: "",
    target_id: "",
    title: "",
    message: "",
  });

  useEffect(() => {
    setTitle("Notifications");
    fetchNotifications();
  }, [setTitle, activeTab]);

  const fetchNotifications = async () => {
    try {
      const type = activeTab === 0 ? "system" : "sent";
      const res = await axios.get(`${API_URL}?type=${type}`);
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch notifications");
    }
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message)
      return toast.error("Title and message required");

    let finalTargetCourse = formData.course || null;
    let finalTargetYear = null;

    if (formData.target_scope === "COURSE_YEAR") finalTargetYear = formData.year;
    else if (formData.target_scope === "ALL") {
      finalTargetCourse = null;
      finalTargetYear = null;
    }

    let targetTypeToSend = "";
    if (formData.target_scope === "ALL" && formData.recipient_type === "STUDENT")
      targetTypeToSend = "ALL_STUDENTS";
    else if (
      formData.target_scope === "ALL" &&
      formData.recipient_type === "LECTURER"
    )
      targetTypeToSend = "ALL_LECTURERS";
    else if (formData.target_scope === "SPECIFIC") targetTypeToSend = "USER";
    else targetTypeToSend = "COURSE";

    const payload = {
      title: formData.title,
      message: formData.message,
      targetType: targetTypeToSend,
      targetCourse: finalTargetCourse,
      targetYear: finalTargetYear,
      targetRegNo:
        formData.recipient_type === "STUDENT" &&
        formData.target_scope === "SPECIFIC"
          ? formData.target_id
          : undefined,
      targetEmail:
        formData.recipient_type === "LECTURER" &&
        formData.target_scope === "SPECIFIC"
          ? formData.target_id
          : undefined,
    };

    try {
      await axios.post(API_URL, payload);
      toast.success("✅ Notification sent!");
      setFormData({
        recipient_type: "STUDENT",
        target_scope: "ALL",
        course: "",
        year: "",
        target_id: "",
        title: "",
        message: "",
      });
      setOpenDialog(false);
      fetchNotifications();
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
      setConfirmOpen(true);
      // toast.success("🗑️ Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const confirmDelete = async () => {
    if (!notifications.id) return;
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      setRows(rows.filter((row) => row.id !== deleteId));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification", error);
      toast.error("Failed to delete notification");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <Box sx={{ px: 3, pt: 4, maxWidth: "900px", mx: "auto" }}>
      {/* Send Notification Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          startIcon={<IoMdAddCircleOutline />}
          variant="contained"
          sx={{
            backgroundColor: themeColor,
            "&:hover": { backgroundColor: "#3f5f4b" },
            textTransform: "none",
            borderRadius: "6px",
            px: 2,
            py: 1,
          }}
          onClick={() => setOpenDialog(true)}
        >
          Send Notification
        </Button>
      </Box>

      {/* Tabs Header */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        TabIndicatorProps={{
          style: { backgroundColor: themeColor, height: 3, borderRadius: 2 },
        }}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            color: "#444",
          },
          "& .Mui-selected": {
            color: themeColor + " !important",
          },
        }}
      >
        <Tab label="System Notifications" />
        <Tab label="Sent Notifications" />
      </Tabs>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <Box
          sx={{
            mt: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              color: themeColor,
              fontWeight: 500,
            }}
          >
            No notifications available
          </Typography>
        </Box>
      ) : (
        notifications.map((n) => (
          <Box
            key={n.id}
            sx={{
              p: 2,
              mb: 1.5,
              bgcolor: secondaryColor,
              borderRadius: 2,
              border: "1px solid #c7d2c7",
              position: "relative",
              "&:hover": { backgroundColor: "#c9d5c9" },
              cursor: "pointer",
            }}
            onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography fontWeight="600" color={themeColor}>
                {n.title}
              </Typography>
              {n.status === "UNREAD" && (
                <Typography variant="caption" color="primary">
                  New
                </Typography>
              )}
            </Box>

            <Collapse in={expandedId === n.id}>
              <Box mt={1} sx={{ position: "relative", pb: 4 }}>
                <Typography variant="body2">{n.message}</Typography>
                {n.course && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Course: {n.course}
                  </Typography>
                )}
                {n.year && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Year: {n.year}
                  </Typography>
                )}
                {n.target_id && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Target: {n.target_id}
                  </Typography>
                )}

                {/* Delete Icon pinned bottom-right */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                  }}
                >
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      sx={{
                        color: "red",
                        transition: "transform 0.15s ease",
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      <DeleteIcon/>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Collapse>
          </Box>
        ))
      )}

      {/* Send Notification Modal */}
      {openDialog && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              bgcolor: "#fff",
              p: 4,
              borderRadius: 3,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 6px 25px rgba(0,0,0,0.2)",
            }}
          >
            <Typography
              variant="h6"
              mb={2}
              sx={{ color: themeColor, fontWeight: 700 }}
            >
              Send Notification
            </Typography>

            {/* Recipient Type */}
            <TextField
              select
              label="Recipient Type"
              fullWidth
              value={formData.recipient_type}
              onChange={(e) =>
                setFormData({ ...formData, recipient_type: e.target.value })
              }
              sx={{ mb: 2 }}
            >
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="LECTURER">Lecturer</MenuItem>
            </TextField>

            {/* Target Scope */}
            <TextField
              select
              label="Target Scope"
              fullWidth
              value={formData.target_scope}
              onChange={(e) =>
                setFormData({ ...formData, target_scope: e.target.value })
              }
              sx={{ mb: 2 }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {formData.recipient_type === "STUDENT" && (
                <>
                  <MenuItem value="COURSE">Course</MenuItem>
                  <MenuItem value="COURSE_YEAR">Course + Year</MenuItem>
                </>
              )}
              <MenuItem value="SPECIFIC">Specific</MenuItem>
            </TextField>

            {/* Conditional Inputs */}
            {(formData.target_scope === "COURSE" ||
              formData.target_scope === "COURSE_YEAR") && (
              <TextField
                label="Course"
                fullWidth
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            )}

            {formData.target_scope === "COURSE_YEAR" && (
              <TextField
                select
                label="Year"
                fullWidth
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                sx={{ mb: 2 }}
              >
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {formData.target_scope === "SPECIFIC" && (
              <TextField
                label={
                  formData.recipient_type === "STUDENT"
                    ? "Registration Number"
                    : "Employee Number"
                }
                fullWidth
                value={formData.target_id}
                onChange={(e) =>
                  setFormData({ ...formData, target_id: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            )}

            {/* Title & Message */}
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              minRows={3}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Typography
                sx={{
                  color: themeColor,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Typography>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: themeColor,
                  "&:hover": { backgroundColor: "#3f5f4b" },
                  textTransform: "none",
                }}
                onClick={handleSendNotification}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Box>
      )}

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
            Are you sure you want to delete this student? This action cannot be undone.
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
    </Box>
  );
}
