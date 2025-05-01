import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

const BodyWeightCard = ({ 
  bodyWeight, 
  setBodyWeight, 
  handleRecordWeight, 
  lastRecordedDate 
}) => {
  return (
    <div className="card">
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          label="Body Weight (kg)"
          type="number"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
        />
        <Button variant="contained" onClick={handleRecordWeight}>
          Record
        </Button>
      </Box>
      <Typography
        variant="body2"
        sx={{ mt: 2, color: "text.secondary" }}
      >
        Last recorded: {lastRecordedDate || "Not recorded yet"}
      </Typography>
    </div>
  );
};

export default BodyWeightCard;