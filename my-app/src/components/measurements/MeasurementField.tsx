import React from "react";
import { TextField, useTheme, useMediaQuery } from "@mui/material";
import { measurementLabels } from "../../constants/measurementConstants";
import { Measurement } from "../../types";

interface MeasurementFieldProps {
  field: keyof Measurement; // Updated from string to keyof Measurement
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: "metric" | "imperial";
}

const MeasurementField: React.FC<MeasurementFieldProps> = React.memo(({ field, value, onChange, unit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <TextField
      fullWidth
      label={`${measurementLabels[field] || String(field).replace(/([A-Z])/g, " $1")} (${unit === "metric" ? "cm" : "in"})`}
      name={String(field)}
      type="number"
      value={value}
      onChange={onChange}
      inputProps={{ 
        step: "0.1",
        style: { 
          fontSize: isMobile ? '0.9rem' : '1rem',
        }
      }}
      variant="outlined"
      margin="dense"
      sx={{
        mb: { xs: 0.5, sm: 1 },
        '.MuiInputLabel-root': {
          fontSize: { xs: '0.75rem', sm: '0.85rem' },
          transform: isMobile ? 'translate(14px, 12px) scale(1)' : undefined,
          '&.MuiInputLabel-shrink': {
            transform: isMobile ? 'translate(14px, -9px) scale(0.75)' : undefined,
          }
        },
        '.MuiOutlinedInput-root': {
          borderRadius: 1.5,
          height: isMobile ? '45px' : 'auto',
          transition: 'all 0.2s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: '1px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: '1px',
          }
        },
        '.MuiInputBase-input': {
          height: isMobile ? '13px' : 'auto',
        }
      }}
    />
  );
});

export default MeasurementField;