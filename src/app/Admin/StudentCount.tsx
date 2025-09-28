import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { MdGroups3 } from "react-icons/md";
import { FaCaretDown } from "react-icons/fa";
import { useEffect, useState } from 'react';
import axios from 'axios';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function StudentCount() {

  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchLecturerCount = async () => {
        try {
            const res = await axios.get('/api/users/stdCount');
            setStudentCount(res.data.studentCount);
        } catch (error) {
            console.error(error);
        }
    };

    fetchLecturerCount();
}, []);
  return (
    <React.Fragment>
      <button className="bg-none p-2 rounded-lg flex items-center">
        <MdGroups3 className="relative text-lg ml-1 mr-1 text-stone-500" />
        <span className=" ml-2 text-base">
        Students
        </span>
      </button>
      <Typography component="p" variant="h4" sx={{ display: "flex", p: 1, ml: 4 }}>
      <h1 className='font-semibold text-stone-700'>{studentCount}</h1> <div className='text-red-500 text-base font-light flex items-center font-poppins ml-4'> 10% <FaCaretDown /></div>
      </Typography>
      
    </React.Fragment>
  );
}