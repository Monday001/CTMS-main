import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import { BsFiletypePdf } from "react-icons/bs";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { FaUsers, FaChalkboardTeacher, FaCalendarAlt, FaClipboardList } from "react-icons/fa";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Link from "next/link";

export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <Link href="/Admin">
        <ListItemText primary="Dashboard" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
      <FaChalkboardTeacher />
      </ListItemIcon>
      <Link href="/Admin/Lecturers">
        <ListItemText primary="Lecturers" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <FaUsers />
      </ListItemIcon>
      <Link href="/Admin/Student">
        <ListItemText primary="Students" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <BarChartIcon />
      </ListItemIcon>
      <Link href="/Admin/Report">
        <ListItemText primary="Reports" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <FaCalendarAlt />
      </ListItemIcon>
      <Link href="/Admin/Timetable">
        <ListItemText primary="Timetables" />
      </Link>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <NotificationsActiveIcon  />
      </ListItemIcon>
      <Link href="/Admin/Notifications">
        <ListItemText primary="Notifications" />
      </Link>
    </ListItemButton>
  </React.Fragment>
);

// export const secondaryListItems = (
//   <React.Fragment>
//     <ListSubheader component="div" inset>
//       Saved reports
//     </ListSubheader>
//     <ListItemButton>
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Current month" />
//     </ListItemButton>
//     <ListItemButton>
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Last quarter" />
//     </ListItemButton>
//     <ListItemButton>
//       <ListItemIcon>
//         <AssignmentIcon />
//       </ListItemIcon>
//       <ListItemText primary="Year-end sale" />
//     </ListItemButton>
//   </React.Fragment>
// );
