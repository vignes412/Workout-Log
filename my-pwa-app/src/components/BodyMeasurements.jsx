import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Typography,
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Bar } from "react-chartjs-2";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { fetchData, saveBodyMeasurementToSheet } from "../utils/sheetsApi";
import dayjs from "dayjs";

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

// Defined outside the component to avoid recreation on each render
const initialMeasurements = {
  date: null,
  weight: "",
  neckRelaxed: "",
  shouldersRelaxed: "",
  chestRelaxed: "",
  chestFlexed: "",
  upperChestRelaxed: "",
  lowerChestRelaxed: "",
  leftUpperArmRelaxed: "",
  leftUpperArmFlexed: "",
  rightUpperArmRelaxed: "",
  rightUpperArmFlexed: "",
  leftForearmRelaxed: "",
  rightForearmRelaxed: "",
  leftWristRelaxed: "",
  rightWristRelaxed: "",
  waistRelaxed: "",
  abdomenRelaxed: "",
  hipsRelaxed: "",
  leftUpperThighRelaxed: "",
  rightUpperThighRelaxed: "",
  leftMidThighRelaxed: "",
  rightMidThighRelaxed: "",
  leftLowerThighRelaxed: "",
  rightLowerThighRelaxed: "",
  leftCalvesRelaxed: "",
  rightCalvesRelaxed: "",
  leftAnkleRelaxed: "",
  rightAnkleRelaxed: "",
};

// Predefined chart colors to maintain consistency
const chartColors = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(199, 199, 199, 0.8)',
  'rgba(83, 102, 255, 0.8)',
];

// Field groups for better organization
const fieldGroups = {
  upperBody: ["neckRelaxed", "shouldersRelaxed", "chestRelaxed", "chestFlexed", "upperChestRelaxed", "lowerChestRelaxed"],
  arms: ["leftUpperArmRelaxed", "leftUpperArmFlexed", "rightUpperArmRelaxed", "rightUpperArmFlexed", 
         "leftForearmRelaxed", "rightForearmRelaxed", "leftWristRelaxed", "rightWristRelaxed"],
  torso: ["waistRelaxed", "abdomenRelaxed", "hipsRelaxed"],
  legs: ["leftUpperThighRelaxed", "rightUpperThighRelaxed", "leftMidThighRelaxed", "rightMidThighRelaxed",
         "leftLowerThighRelaxed", "rightLowerThighRelaxed", "leftCalvesRelaxed", "rightCalvesRelaxed", 
         "leftAnkleRelaxed", "rightAnkleRelaxed"]
};

// Memoize measurement labels to prevent recreation on each render
const measurementLabels = {
  chestRelaxed: "Chest Relaxed",
  chestFlexed: "Chest Flexed",
  leftUpperArmRelaxed: "Left Upper Arm Relaxed",
  rightUpperArmRelaxed: "Right Upper Arm Relaxed",
  waistRelaxed: "Waist Relaxed",
  abdomenRelaxed: "Abdomen Relaxed",
  leftUpperThighRelaxed: "Left Upper Thigh Relaxed",
  rightUpperThighRelaxed: "Right Upper Thigh Relaxed",
  weight: "Weight",
  neckRelaxed: "Neck Relaxed",
  shouldersRelaxed: "Shoulders Relaxed",
  upperChestRelaxed: "Upper Chest Relaxed",
  lowerChestRelaxed: "Lower Chest Relaxed",
  leftUpperArmFlexed: "Left Upper Arm Flexed",
  rightUpperArmFlexed: "Right Upper Arm Flexed",
  leftForearmRelaxed: "Left Forearm Relaxed",
  rightForearmRelaxed: "Right Forearm Relaxed",
  leftWristRelaxed: "Left Wrist Relaxed",
  rightWristRelaxed: "Right Wrist Relaxed",
  hipsRelaxed: "Hips Relaxed",
  leftMidThighRelaxed: "Left Mid Thigh Relaxed",
  rightMidThighRelaxed: "Right Mid Thigh Relaxed",
  leftLowerThighRelaxed: "Left Lower Thigh Relaxed",
  rightLowerThighRelaxed: "Right Lower Thigh Relaxed",
  leftCalvesRelaxed: "Left Calves Relaxed",
  rightCalvesRelaxed: "Right Calves Relaxed",
  leftAnkleRelaxed: "Left Ankle Relaxed",
  rightAnkleRelaxed: "Right Ankle Relaxed",
};

// Create reusable TextField component with memoization
const MeasurementField = React.memo(({ field, value, onChange, unit }) => (
  <TextField
    fullWidth
    label={`${measurementLabels[field] || field.replace(/([A-Z])/g, " $1")} (${unit === "metric" ? "cm" : "in"})`}
    name={field}
    type="number"
    value={value}
    onChange={onChange}
    inputProps={{ step: "0.1" }}
  />
));

const BodyMeasurements = ({ accessToken, onNavigate, themeMode }) => {
  const [measurements, setMeasurements] = useState({...initialMeasurements});
  const [logs, setLocalLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickEntry, setQuickEntry] = useState(true);
  const [unit, setUnit] = useState("metric");

  const [selectedMeasurements, setSelectedMeasurements] = useState({
    upperBody: ["chestRelaxed", "chestFlexed"],
    arms: ["leftUpperArmRelaxed", "rightUpperArmRelaxed"],
    torso: ["waistRelaxed", "abdomenRelaxed"],
    legs: ["leftUpperThighRelaxed", "rightUpperThighRelaxed"],
  });

  // Memoized resetMeasurements function
  const resetMeasurements = useCallback(() => ({...initialMeasurements}), []);

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await fetchData("Body_Measurements!A2:AC");
        setLocalLogs(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load measurements from spreadsheet.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name !== "date" && value && isNaN(value)) {
      setError(`${name} must be a valid number.`);
      return;
    }
    setMeasurements((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  const handleUnitChange = useCallback((event, newUnit) => {
    if (newUnit) setUnit(newUnit);
  }, []);

  const convertValue = useCallback((value, fromUnit, toUnit) => {
    if (!value) return 0;
    if (fromUnit === toUnit) return parseFloat(value);
    if (fromUnit === "metric" && toUnit === "imperial") {
      return parseFloat(value) * 2.20462;
    } else if (fromUnit === "imperial" && toUnit === "metric") {
      return parseFloat(value) / 2.20462;
    }
    return parseFloat(value);
  }, []);

  const prepareData = useCallback((measurements) => {
    const formattedDate = measurements.date
      ? dayjs(measurements.date).format("YYYY-MM-DD")
      : "";
    const weightValue = convertValue(measurements.weight, unit, "metric");
    
    // Use a more efficient approach to build the array
    return [
      formattedDate,
      weightValue || 0,
      ...Object.keys(initialMeasurements)
        .filter(key => key !== 'date' && key !== 'weight')
        .map(key => parseFloat(measurements[key]) || 0)
    ];
  }, [convertValue, unit]);

  const handleSave = useCallback(async () => {
    if (!measurements.date || !measurements.weight) {
      setError("Date and Weight are required fields.");
      setSaveStatus("");
      return;
    }

    try {
      const row = prepareData(measurements);
      await saveBodyMeasurementToSheet(
        "Body_Measurements!A2:AC",
        row,
        accessToken
      );
      setLocalLogs((prev) => [...prev, row]);
      setMeasurements(resetMeasurements());
      setSaveStatus("Measurements saved successfully!");
      setError("");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save measurements. Please try again.");
      setSaveStatus("");
    }
  }, [accessToken, measurements, prepareData, resetMeasurements]);

  const handleSelectionChange = useCallback((group, value) => {
    setSelectedMeasurements((prev) => ({ ...prev, [group]: value }));
  }, []);

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
          };
        })
      ),
    };
    return chartData;
  }, [logs, selectedMeasurements]);

  // Memoize chart options to prevent recreation on every render
  const dynamicChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: themeMode === "dark" ? "#ffffff" : "#000000",
          padding: 10,
          usePointStyle: true,
          font: {
            size: 11
          }
        },
      },
      title: {
        display: true,
        text: "Selected Body Measurements Over Time",
        color: themeMode === "dark" ? "#ffffff" : "#000000",
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: themeMode === "dark" ? "#b0bec5" : "#000000" },
        grid: { color: themeMode === "dark" ? "#424242" : "#e0e0e0" },
      },
      y: {
        ticks: { color: themeMode === "dark" ? "#b0bec5" : "#000000" },
        grid: { color: themeMode === "dark" ? "#424242" : "#e0e0e0" },
        beginAtZero: true,
        title: {
          display: true,
          text: unit === "metric" ? "Measurement (cm)" : "Measurement (in)",
          color: themeMode === "dark" ? "#ffffff" : "#000000",
        },
      },
    },
  }), [themeMode, unit]);

  // Memoize the measurement form to prevent unnecessary re-renders
  const MeasurementForm = useMemo(() => (
    <>
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={unit}
          exclusive
          onChange={handleUnitChange}
          aria-label="unit selection"
          size="small"
        >
          <ToggleButton value="metric">Metric (kg/cm)</ToggleButton>
          <ToggleButton value="imperial">Imperial (lbs/in)</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={!quickEntry}
              onChange={(e) => setQuickEntry(!e.target.checked)}
            />
          }
          label="Full Entry (All Measurements)"
          sx={{ ml: 2 }}
        />
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Date"
            value={measurements.date}
            onChange={(newValue) =>
              setMeasurements((prev) => ({ ...prev, date: newValue }))
            }
            slotProps={{ textField: { fullWidth: true, required: true } }}
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
          />
        </Grid>
      </Grid>

      {!quickEntry && (
        <>
          {Object.entries(fieldGroups).map(([group, fields]) => (
            <Accordion key={group} defaultExpanded={group === "upperBody"}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{group.replace(/([A-Z])/g, " $1")}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
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
        </>
      )}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!measurements.date || !measurements.weight}
          >
            Save Measurements
          </Button>
        </Grid>
      </Grid>

      {saveStatus && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {saveStatus}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  ), [measurements, quickEntry, unit, handleInputChange, handleSave, handleUnitChange, saveStatus, error]);

  // Memoize the chart selection controls
  const ChartControls = useMemo(() => (
    <Box sx={{ mb: 2 }}>
      {["upperBody", "arms", "torso", "legs"].map((group) => (
        <FormControl key={group} sx={{ m: 1, minWidth: 200 }}>
          <InputLabel>{group.replace(/([A-Z])/g, " $1")}</InputLabel>
          <Select
            multiple
            value={selectedMeasurements[group]}
            onChange={(e) => handleSelectionChange(group, e.target.value)}
            renderValue={(selected) =>
              selected
                .map((field) => measurementLabels[field] || field)
                .join(", ")
            }
          >
            {fieldGroups[group]
              .filter(field => Object.keys(measurementLabels).includes(field))
              .map((field) => (
                <MenuItem key={field} value={field}>
                  {measurementLabels[field]}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      ))}
    </Box>
  ), [selectedMeasurements, handleSelectionChange]);

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
              {MeasurementForm}
              
              {logs.length > 0 && (
                <>
                  {ChartControls}
                  
                  <Box className="chart-wrapper" sx={{ height: 350, mt: 2 }}>
                    <Bar data={dynamicChartData} options={dynamicChartOptions} />
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default React.memo(BodyMeasurements);
