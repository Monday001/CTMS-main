import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { IoMdArrowDropup } from 'react-icons/io';
import { BsFiletypePdf } from "react-icons/bs";
import { useEffect, useState } from 'react';
import axios from 'axios';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function LecturerCount() {
  const [pdfCount, setPdfCount] = useState(0);

  useEffect(() => {
    const fetchLecturerCount = async () => {
        try {
            const res = await axios.get('/api/users/pdfCount');
            setPdfCount(res.data.pdfCount);
        } catch (error) {
            console.error(error);
        }
    };

    fetchLecturerCount();
}, []);
  return (
    <React.Fragment>
      <button className="bg-none p-2 rounded-lg flex items-center">
        <BsFiletypePdf className="relative text-lg ml-1 mr-1 text-stone-500" />
        <span className=" ml-2 text-base">
        Timetable
        </span>
      </button>
      <Typography component="p" variant="h4" sx={{ display: "flex", p: 1, ml: 4 }}>
        <h1 className='font-semibold text-stone-700'>{pdfCount}</h1> <div className='text-green-500 text-base font-light flex items-center font-poppins ml-4'> 100% <IoMdArrowDropup /></div>
      </Typography>
    </React.Fragment>
  );
}