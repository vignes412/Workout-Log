import React from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";

const HighlightMetricCard = ({ value, label }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <div className="card hightLightBox">
      <p
        className="highLightLBL"
        style={{
          fontSize: isMobile ? "1.8rem" : "2.5rem",
          marginTop: "-12px",
          color: "text.primary",
          fontWeight: "bold"
        }}
      >
        {value}
      </p>
      <span style={{
        fontSize: isMobile ? "0.85rem" : "1rem",
        fontWeight: isMobile ? "500" : "normal"
      }}>
        {label}
      </span>
    </div>
  );
};

const ChartCard = ({ title, children, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <div className={`card ${isMobile ? 'mobile-card' : ''}`}>
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        mb: isMobile ? 0.5 : 1
      }}>
        {title && (
          <Box component="h3" sx={{ 
            margin: 0, 
            fontSize: isMobile ? "0.9rem" : "1.1rem",
            fontWeight: "500",
            pl: 1
          }}>
            {title}
          </Box>
        )}
        <IconButton onClick={onRefresh} size={isMobile ? "small" : "medium"} sx={{ p: isMobile ? 0.5 : 1 }}>
          <RefreshIcon sx={{ 
            color: "text.primary",
            fontSize: isMobile ? "1rem" : "1.25rem" 
          }} />
        </IconButton>
      </Box>
      {children}
    </div>
  );
};

export { HighlightMetricCard, ChartCard };