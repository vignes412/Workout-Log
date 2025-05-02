import React from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SaveIcon from "@mui/icons-material/Save";
import MeasurementField from "./MeasurementField";
import { fieldGroups } from "../../constants/measurementConstants";

const MeasurementForm = ({
  measurements,
  quickEntry,
  unit,
  handleInputChange,
  handleUnitChange,
  toggleQuickEntry,
  handleDateChange,
  handleSave,
  saveStatus,
  error,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box 
          sx={{ 
            mb: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
          }}
        >
          <ToggleButtonGroup
            value={unit}
            exclusive
            onChange={handleUnitChange}
            aria-label="unit selection"
            size={isMobile ? "small" : "medium"}
            sx={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '.MuiToggleButton-root': {
                borderRadius: '4px',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                }
              }
            }}
          >
            <ToggleButton value="metric">Metric (kg/cm)</ToggleButton>
            <ToggleButton value="imperial">Imperial (lbs/in)</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={!quickEntry}
                onChange={toggleQuickEntry}
                sx={{ 
                  '&.Mui-checked': { 
                    color: 'primary.main' 
                  }
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, fontWeight: 500 }}>
                Full Entry (All Measurements)
              </Typography>
            }
            sx={{ 
              ml: { xs: 0, sm: 2 },
              '.MuiFormControlLabel-label': {
                fontSize: { xs: '0.85rem', sm: '0.9rem' }
              }
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date"
              value={measurements.date}
              onChange={handleDateChange}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  required: true,
                  variant: "outlined",
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderWidth: '1px',
                      }
                    }
                  }
                } 
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Weight (${unit === "metric" ? "kg" : "lbs"})`}
              name="weight"
              type="number"
              value={measurements.weight}
              onChange={handleInputChange}
              required
              inputProps={{ step: "0.1" }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '1px',
                  }
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {!quickEntry && (
        <Box sx={{ mb: 2, maxHeight: isMobile ? 'calc(100vh - 400px)' : 'auto', overflowY: 'auto' }}>
          {Object.entries(fieldGroups).map(([group, fields], index) => (
            <Accordion 
              key={group} 
              defaultExpanded={group === "upperBody"} 
              sx={{ 
                mb: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '&:before': {
                  display: 'none'
                },
                borderRadius: '8px !important',
                overflow: 'hidden',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
                '&.Mui-expanded': {
                  margin: '0 0 8px 0'
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  '&.Mui-expanded': {
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    mb: 1
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FitnessCenterIcon 
                    fontSize="small" 
                    sx={{ 
                      color: index % 2 === 0 ? 'primary.main' : 'secondary.main',
                      opacity: 0.8
                    }} 
                  />
                  <Typography 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      textTransform: 'capitalize'
                    }}
                  >
                    {group.replace(/([A-Z])/g, " $1")}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid item xs={12} sm={6} md={4} key={field}>
                      <MeasurementField 
                        field={field} 
                        value={measurements[field]} 
                        onChange={handleInputChange}
                        unit={unit}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={!measurements.date || !measurements.weight}
        startIcon={<SaveIcon />}
        fullWidth
        size={isMobile ? "large" : "medium"}
        sx={{
          mt: 2,
          mb: 2,
          py: { xs: 1.5, sm: 1 },
          borderRadius: 2,
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          fontWeight: 600,
          textTransform: 'none',
          fontSize: { xs: '0.9rem', sm: '1rem' },
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transform: 'translateY(1px)'
          }
        }}
      >
        Save Measurements
      </Button>

      {saveStatus && (
        <Alert 
          severity="success" 
          sx={{ 
            mt: 2,
            borderRadius: 2,
            animation: 'fadeIn 0.5s',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          {saveStatus}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 2,
            animation: 'fadeIn 0.5s',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)'
              }
            }
          }}
        >
          {error}
        </Alert>
      )}
    </>
  );
};

export default React.memo(MeasurementForm);