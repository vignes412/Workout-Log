import React from "react";
import {
  Typography,
  Box,
  Button,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import MeasurementForm from "./MeasurementForm";
import MeasurementChart from "./MeasurementChart";
import useMeasurements from "../hooks/useMeasurements";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const BodyMeasurements = ({ accessToken, onNavigate, themeMode }) => {
  const {
    measurements,
    logs,
    saveStatus,
    error,
    loading,
    quickEntry,
    unit,
    selectedMeasurements,
    handleInputChange,
    handleUnitChange,
    handleSave,
    handleSelectionChange,
    toggleQuickEntry,
    handleDateChange,
  } = useMeasurements(accessToken);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="main-container">
        <Box className="header">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onNavigate("dashboard")}
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>
          <Box className="header-profile">
            <Avatar alt="User" src="/path-to-profile-pic.jpg" />
            <Typography>User Name</Typography>
          </Box>
        </Box>

        <Box className="card">
          <Typography className="card-title">Body Measurements</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <MeasurementForm
                measurements={measurements}
                quickEntry={quickEntry}
                unit={unit}
                handleInputChange={handleInputChange}
                handleUnitChange={handleUnitChange}
                toggleQuickEntry={toggleQuickEntry}
                handleDateChange={handleDateChange}
                handleSave={handleSave}
                saveStatus={saveStatus}
                error={error}
              />
              
              {logs.length > 0 && (
                <MeasurementChart
                  logs={logs}
                  selectedMeasurements={selectedMeasurements}
                  handleSelectionChange={handleSelectionChange}
                  themeMode={themeMode}
                  unit={unit}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default React.memo(BodyMeasurements);
