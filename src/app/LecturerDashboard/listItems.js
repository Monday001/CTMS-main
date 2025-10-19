import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";
import { FaBookOpen } from "react-icons/fa";

export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <Link href="/LecturerDashboard">
        <ListItemText primary="Dashboard" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
      <LayersIcon />
      </ListItemIcon>
      <Link href="/LecturerDashboard/Timetable">
        <ListItemText primary="Timetable" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <FaBookOpen />
      </ListItemIcon>
      <Link href="/LecturerDashboard/Units">
        <ListItemText primary="Units" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>
      <Link href="/LecturerDashboard/Notes">
        <ListItemText primary="Notes" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <NotificationsActiveIcon  />
      </ListItemIcon>
      <Link href="/LecturerDashboard/Notifications">
        <ListItemText primary="Notifications" />
      </Link>
    </ListItemButton>
  </React.Fragment>
);
