// import React, { useState, useEffect } from "react";
// import { Typography, Box, Paper } from "@mui/material";
// import reportWebVitals from "../reportWebVitals";

// const PerformanceDashboard = () => {
//   const [metrics, setMetrics] = useState({});

//   useEffect(() => {
//     reportWebVitals((metric) => {
//       setMetrics((prev) => ({ ...prev, [metric.name]: metric.value }));
//     });
//   }, []);

//   return (
//     <Box sx={{ mt: 4 }}>
//       <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
//         Performance Metrics
//       </Typography>
//       <Paper elevation={3} sx={{ p: 3, borderRadius: "10px" }}>
//         <Typography>
//           CLS: {metrics.CLS?.toFixed(3) || "N/A"} (Cumulative Layout Shift)
//         </Typography>
//         <Typography>
//           FID: {metrics.FID?.toFixed(1) || "N/A"}ms (First Input Delay)
//         </Typography>
//         <Typography>
//           FCP: {metrics.FCP?.toFixed(1) || "N/A"}ms (First Contentful Paint)
//         </Typography>
//         <Typography>
//           LCP: {metrics.LCP?.toFixed(1) || "N/A"}ms (Largest Contentful Paint)
//         </Typography>
//         <Typography>
//           TTFB: {metrics.TTFB?.toFixed(1) || "N/A"}ms (Time to First Byte)
//         </Typography>
//       </Paper>
//     </Box>
//   );
// };

// export default PerformanceDashboard;
