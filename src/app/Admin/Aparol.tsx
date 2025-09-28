import * as React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { TiHeartFullOutline } from "react-icons/ti";
import { IoMdArrowDropup } from 'react-icons/io';


function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function LecturerCount() {
  return (
    <React.Fragment>
      <button className="bg-none p-2 rounded-lg flex items-center">
        <TiHeartFullOutline className="relative text-lg ml-1 mr-1 text-red-600" />
        <span className=" ml-2 text-base">
        Loyalty
        </span>
      </button>
      <Typography component="p" variant="h4" sx={{ display: "flex", p: 1, ml: 4 }}>
        <h1 className='font-semibold text-stone-700'>89%</h1> <div className='text-green-500 text-base font-light flex items-center font-poppins ml-4'> 18% <IoMdArrowDropup /></div>
      </Typography>
    </React.Fragment>
  );
}