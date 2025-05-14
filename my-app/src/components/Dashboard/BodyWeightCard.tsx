import React from "react";
import { Box, Typography, TextField, Button, Paper, useTheme } from "@mui/material";

interface BodyWeightCardProps {
  bodyWeight: string | number;
  setBodyWeight: (value: string | number) => void;
  handleRecordWeight: () => void;
  lastRecordedDate: string | null;
}

const BodyWeightCard: React.FC<BodyWeightCardProps> = React.memo(({ 
  bodyWeight, 
  setBodyWeight, 
  handleRecordWeight, 
  lastRecordedDate 
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
        }
      }}
    >
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          label="Body Weight (kg)"
          type="number"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            sx: { borderRadius: 1 }
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleRecordWeight}
          sx={{ 
            minWidth: '80px',
            height: '40px',
            borderRadius: 1
          }}
        >
          Record
        </Button>
      </Box>
      <Typography
        variant="body2"
        sx={{ mt: 2, color: "text.secondary" }}
      >
        Last recorded: {lastRecordedDate || "Not recorded yet"}
      </Typography>
    </Paper>
  );
});

BodyWeightCard.displayName = 'BodyWeightCard';

export default BodyWeightCard;