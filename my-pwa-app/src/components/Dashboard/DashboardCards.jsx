import React from "react";
import { Box, IconButton } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const HighlightMetricCard = ({ value, label }) => {
  return (
    <div className="card hightLightBox">
      <p
        className="highLightLBL"
        style={{
          fontSize: "2.5rem",
          marginTop: "-12px",
          color: "text.primary"
        }}
      >
        {value}
      </p>{" "}
      {label}
    </div>
  );
};

const ChartCard = ({ title, children, onRefresh }) => {
  return (
    <div className="card">
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton onClick={onRefresh} size="small">
          <RefreshIcon sx={{ color: "text.primary" }} />
        </IconButton>
      </Box>
      {children}
    </div>
  );
};

export { HighlightMetricCard, ChartCard };