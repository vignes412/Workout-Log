import React, { memo } from "react";
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
import MeasurementForm from "./measurements/MeasurementForm";
import MeasurementChart from "./measurements/MeasurementChart";
import useMeasurements from "../hooks/useMeasurements";
import { useAppContext } from "../context/AppContext";
import { useDataContext } from "../context/DataContext";
import { Dayjs } from "dayjs";

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

interface BodyMeasurementsProps {
  onNavigate?: (page: string) => void;
}

const BodyMeasurements: React.FC<BodyMeasurementsProps> = ({ onNavigate }) => {
  const { state: appState } = useAppContext();
  const { state: dataState, fetchMeasurements } = useDataContext();
  
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
  } = useMeasurements(appState.accessToken);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Body Measurements
        </Typography>
        
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
                themeMode={appState.isDarkMode ? 'dark' : 'light'}
                unit={unit}
              />
            )}
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default memo(BodyMeasurements);