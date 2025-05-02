import React, { useMemo } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  Grid,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import { measurementLabels, fieldGroups, chartColors, initialMeasurements } from "../../constants/measurementConstants";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const MeasurementChart = ({
  logs,
  selectedMeasurements,
  handleSelectionChange,
  themeMode,
  unit
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoize chart data to prevent recalculations on every render
  const dynamicChartData = useMemo(() => {
    const chartData = {
      labels: logs.map((log) => log[0]),
      datasets: Object.entries(selectedMeasurements).flatMap(([group, fields], groupIndex) =>
        fields.map((field, fieldIndex) => {
          const colorIndex = (groupIndex * 2 + fieldIndex) % chartColors.length;
          return {
            label: measurementLabels[field] || field,
            data: logs.map(
              (log) => parseFloat(log[Object.keys(initialMeasurements).indexOf(field)]) || 0
            ),
            backgroundColor: chartColors[colorIndex],
            borderColor: chartColors[colorIndex],
            borderWidth: 1,
            borderRadius: 4,
            barThickness: isMobile ? 16 : 20,
            hoverBackgroundColor: theme.palette.mode === 'dark' 
              ? `${chartColors[colorIndex]}dd` 
              : `${chartColors[colorIndex]}cc`,
          };
        })
      ),
    };
    return chartData;
  }, [logs, selectedMeasurements, isMobile, theme.palette.mode]);

  // Memoize chart options to prevent recreation on every render
  const dynamicChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          color: themeMode === "dark" ? "#ffffff" : "#000000",
          padding: isMobile ? 6 : 10,
          usePointStyle: true,
          boxWidth: isMobile ? 6 : 10,
          boxHeight: isMobile ? 6 : 10,
          font: {
            size: isMobile ? 9 : 11,
            family: "'Roboto', sans-serif",
          }
        },
      },
      title: {
        display: true,
        text: "Selected Body Measurements Over Time",
        color: themeMode === "dark" ? "#ffffff" : "#000000",
        font: {
          size: isMobile ? 14 : 16,
          weight: 'bold',
          family: "'Roboto', sans-serif",
        },
        padding: { top: 10, bottom: isMobile ? 15 : 20 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: themeMode === 'dark' ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: themeMode === 'dark' ? '#e2e8f0' : '#2c3e50',
        bodyColor: themeMode === 'dark' ? '#e2e8f0' : '#2c3e50',
        borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: isMobile ? 8 : 10,
        cornerRadius: 6,
        titleFont: {
          size: isMobile ? 11 : 13,
          weight: 'bold',
        },
        bodyFont: {
          size: isMobile ? 10 : 12,
        },
        displayColors: true,
        boxWidth: isMobile ? 10 : 12,
        boxHeight: isMobile ? 10 : 12,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toFixed(1)} ${unit === "metric" ? "cm" : "in"}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { 
          color: themeMode === "dark" ? "#b0bec5" : "#000000",
          font: {
            size: isMobile ? 9 : 11,
          },
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        },
        grid: { 
          color: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
      },
      y: {
        ticks: { 
          color: themeMode === "dark" ? "#b0bec5" : "#000000",
          font: {
            size: isMobile ? 9 : 11,
          },
          padding: isMobile ? 4 : 8,
        },
        grid: { 
          color: themeMode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        beginAtZero: true,
        title: {
          display: true,
          text: unit === "metric" ? "Measurement (cm)" : "Measurement (in)",
          color: themeMode === "dark" ? "#ffffff" : "#000000",
          font: {
            size: isMobile ? 10 : 12,
            weight: 'medium',
          },
          padding: { top: 0, bottom: 10 }
        },
      },
    },
    layout: {
      padding: {
        left: isMobile ? 0 : 10,
        right: isMobile ? 0 : 10,
        top: 0,
        bottom: 0,
      }
    },
  }), [themeMode, unit, isMobile, theme.palette.mode]);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        borderRadius: 3,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <TrendingUpIcon 
          color="primary" 
          sx={{ 
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            opacity: 0.8
          }} 
        />
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          Measurement Tracking Chart
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {["upperBody", "arms", "torso", "legs"].map((group) => (
          <Grid item xs={12} sm={6} key={group}>
            <FormControl 
              fullWidth
              sx={{ 
                mb: { xs: 1, sm: 2 },
                '.MuiInputLabel-root': {
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                },
                '.MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  transition: 'all 0.2s ease',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                },
                '.MuiSelect-select': {
                  minHeight: { xs: '2.5rem !important', sm: '3.5rem !important' },
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  alignItems: 'center',
                  padding: '8px 14px !important'
                }
              }}
            >
              <InputLabel 
                id={`${group}-label`}
                sx={{ 
                  textTransform: 'capitalize',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {group.replace(/([A-Z])/g, " $1")}
              </InputLabel>
              <Select
                labelId={`${group}-label`}
                multiple
                value={selectedMeasurements[group]}
                onChange={(e) => handleSelectionChange(group, e.target.value)}
                label={group.replace(/([A-Z])/g, " $1")}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((field) => (
                      <Chip
                        key={field}
                        label={measurementLabels[field] || field}
                        size="small"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          height: { xs: 22, sm: 24 },
                          fontWeight: 500,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                        }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                    },
                  },
                }}
              >
                {fieldGroups[group]
                  .filter(field => Object.keys(measurementLabels).includes(field))
                  .map((field) => (
                    <MenuItem 
                      key={field} 
                      value={field}
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        minHeight: { xs: '32px', sm: '40px' }
                      }}
                    >
                      {measurementLabels[field]}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        ))}
      </Grid>
      
      <Box 
        className="chart-wrapper" 
        sx={{ 
          height: { xs: 300, sm: 350, md: 400 }, 
          mt: 2,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)',
          p: { xs: 1, sm: 2 },
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        <Bar data={dynamicChartData} options={dynamicChartOptions} />
      </Box>
    </Paper>
  );
};

export default React.memo(MeasurementChart);