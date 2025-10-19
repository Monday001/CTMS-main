"use client";
import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, IconButton, Typography, LinearProgress, Button, Tooltip } from "@mui/material";
import { CloudDownloadOutlined, ArchiveOutlined, DeleteOutline, DescriptionOutlined } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import "filepond/dist/filepond.min.css";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { usePageTitle } from "../layout";

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateSize, FilePondPluginFileValidateType);

// Colors
const themeColor = "#50765F";
const secondaryColor = "#D0DCD0";

// TODO: Replace this with your actual user role logic
const userRole = "ADMIN";

interface TimetableFile {
  id: number;
  name: string;
  filePath: string;
  status: "current" | "archived";
  createdAt: string;
  [key: string]: any;
}

export default function Timetable() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [tabValue, setTabValue] = useState(0);
  const [timetables, setTimetables] = useState<TimetableFile[]>([]);
  const [currentTimetable, setCurrentTimetable] = useState<TimetableFile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    setTitle("Timetable Manager");
    loadTimetables();
  }, [setTitle]);

  const loadTimetables = async () => {
    setFetching(true);
    try {
      const [currentRes, allRes] = await Promise.all([
        axios.get("/api/users/timetable?type=current"),
        axios.get("/api/users/timetable"),
      ]);
      const currentData = currentRes.data;
      setCurrentTimetable(
        !currentData || !currentData.id || currentData.message ? null : currentData
      );
      setTimetables(allRes.data || []);
    } catch {
      toast.error("Failed to load timetables");
    } finally {
      setFetching(false);
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await axios.put(`/api/users/timetable?id=${id}&action=archive`);
      toast.success("📦 Timetable archived successfully");
      setCurrentTimetable(null);
      loadTimetables();
    } catch {
      toast.error("Failed to archive timetable");
    }
  };

  const handleDownload = (file: TimetableFile) => {
    const link = document.createElement("a");
    link.href = file.filePath.replace(/\\/g, "/");
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("📥 Download started");
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this file?")) return;
    try {
      await axios.delete(`/api/users/timetable?id=${id}&action=delete`);
      toast.success("🗑️ Timetable permanently deleted");
      loadTimetables();
    } catch {
      toast.error("Failed to delete timetable");
    }
  };

  const handleUploadSuccess = () => {
    toast.success("✅ Timetable uploaded successfully!");
    setLoading(false);
    setProgress(100);
    setTimeout(() => {
      setOpenDialog(false);
      loadTimetables();
    }, 800);
  };

  const handleUploadError = () => {
    toast.error("❌ Upload failed");
    setLoading(false);
    setProgress(0);
  };

  const handleDownloadTemplate = () => {
    window.open("/templates/timetable-sample.xlsx", "_blank");
  };

  const archivedTimetables = timetables.filter((t) => t.status === "archived");

  return (
    <Box sx={{ px: 3, pt: 4, maxWidth: "900px", mx: "auto" }}>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Upload Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          startIcon={<AddIcon sx={{ color: "white" }} />}
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
          Upload New Timetable
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
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
        <Tab label="Current Timetable" />
        <Tab label="Archived Timetables" />
      </Tabs>

      {/* Main Content */}
      {fetching ? (
        <Box
          sx={{
            py: 10,
            textAlign: "center",
            color: "#777",
            fontStyle: "italic",
          }}
        >
          No timetables to display yet...
        </Box>
      ) : tabValue === 0 ? (
        <>
          {currentTimetable ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: secondaryColor,
                p: 2,
                borderRadius: 2,
                border: "1px solid #c7d2c7",
                "&:hover": { backgroundColor: "#c9d5c9" },
              }}
            >
              <Box>
                <Typography fontWeight="600" color={themeColor}>
                  {currentTimetable.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uploaded on{" "}
                  {new Date(currentTimetable.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Download" arrow>
                  <IconButton onClick={() => handleDownload(currentTimetable)} sx={{ color: themeColor }}>
                    <CloudDownloadOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Archive" arrow>
                  <IconButton onClick={() => handleArchive(currentTimetable.id)} sx={{ color: themeColor }}>
                    <ArchiveOutlined />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No current timetable uploaded yet.
            </Typography>
          )}
        </>
      ) : (
        <>
          {archivedTimetables.length === 0 ? (
            <Typography color="text.secondary">
              No archived timetables available.
            </Typography>
          ) : (
            archivedTimetables.map((t) => (
              <Box
                key={t.id}
                sx={{
                  p: 2,
                  mb: 1.5,
                  bgcolor: secondaryColor,
                  borderRadius: 2,
                  border: "1px solid #c7d2c7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { backgroundColor: "#c9d5c9" },
                }}
              >
                <Box>
                  <Typography fontWeight="600" color={themeColor}>
                    {t.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded on {new Date(t.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Download" arrow>
                    <IconButton
                      onClick={() => handleDownload(t)}
                      sx={{ color: themeColor }}
                    >
                      <CloudDownloadOutlined />
                    </IconButton>
                  </Tooltip>
                  {userRole === "ADMIN" && (
                    <Tooltip title="Delete Permanently" arrow>
                      <IconButton
                        onClick={() => handlePermanentDelete(t.id)}
                        sx={{
                          color: "red",
                          transition: "transform 0.15s ease",
                          "&:hover": { transform: "scale(1.1)" },
                        }}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))
          )}
        </>
      )}

      {/* Upload Modal */}
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
            <Typography variant="h6" mb={2} sx={{ color: themeColor, fontWeight: 700 }}>
              Upload New Timetable
            </Typography>

            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={handleDownloadTemplate} sx={{ color: themeColor }} >
                <CloudDownloadOutlined />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Download Sample Template
              </Typography>
            </Box>

            {loading && (
              <Box sx={{ width: "100%", mb: 2 }}>
                <Typography align="center" variant="body2" sx={{ mb: 0.5 }}>
                  Uploading... {progress.toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    "& .MuiLinearProgress-bar": { backgroundColor: themeColor },
                  }}
                />
              </Box>
            )}

            <FilePond
              server={{
                process: {
                  url: currentTimetable
                    ? `/api/users/timetable?replace_id=${currentTimetable.id}`
                    : "/api/users/timetable",
                  method: "POST",
                  ondata: (formData) => {
                    setLoading(true);
                    setProgress(0);
                    formData.append("timestamp", new Date().toISOString());
                    return formData;
                  },
                  onload: (response: any) => {
                    handleUploadSuccess();
                    return response?.id || 0;
                  },
                  onerror: (error) => {
                    handleUploadError();
                    return error;
                  },
                },
              }}
              onprocessfileprogress={(_file, progressRatio) =>
                setProgress(progressRatio * 100)
              }
              acceptedFileTypes={[
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/csv",
              ]}
              allowMultiple={false}
              maxFiles={1}
              maxFileSize="20MB"
              credits={false}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
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
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
