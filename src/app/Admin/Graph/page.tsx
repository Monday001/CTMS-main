"use client";
import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import Typography from '@mui/material/Typography';

export default function ChartsOverviewDemo() {
  return (
    <React.Fragment>
      <Typography component="p" variant="h6" color="text.secondary" sx={{ flex: 1, mb: 4 }}>
        Analytics Of Student Attendance.
      </Typography>
    <BarChart
      series={[
        { data: [35, 44, 24, 34] },
        { data: [51, 6, 49, 30] },
        { data: [15, 25, 30, 50] },
        { data: [6, 20, 45, 25] },
      ]}
      height={290}
      xAxis={[{ data: ['Y1S2', 'Y2S2', 'Y3S2', 'Y4S2'], scaleType: 'band' }]}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
    />
    </React.Fragment>
  );
}