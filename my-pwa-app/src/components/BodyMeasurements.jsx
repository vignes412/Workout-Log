import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Bar, Line } from "react-chartjs-2";
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

const BodyMeasurements = ({ accessToken, onNavigate, themeMode }) => {
  const [measurements, setMeasurements] = useState({
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
  });

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

  const measurementLabels = {
    chestRelaxed: "Chest Relaxed",
    chestFlexed: "Chest Flexed",
    leftUpperArmRelaxed: "Left Upper Arm Relaxed",
    rightUpperArmRelaxed: "Right Upper Arm Relaxed",
    waistRelaxed: "Waist Relaxed",
    abdomenRelaxed: "Abdomen Relaxed",
    leftUpperThighRelaxed: "Left Upper Thigh Relaxed",
    rightUpperThighRelaxed: "Right Upper Thigh Relaxed",
  };

  const resetMeasurements = () => ({
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
  });

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await fetchData("Body_Measurements!A2:AC");
        setLocalLogs(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load measurements from spreadsheet.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name !== "date" && value && isNaN(value)) {
      setError(`${name} must be a valid number.`);
      return;
    }
    setMeasurements((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleUnitChange = (event, newUnit) => {
    if (newUnit) setUnit(newUnit);
  };

  const convertValue = (value, fromUnit, toUnit) => {
    if (!value) return 0;
    if (fromUnit === toUnit) return parseFloat(value);
    if (fromUnit === "metric" && toUnit === "imperial") {
      return parseFloat(value) * 2.20462;
    } else if (fromUnit === "imperial" && toUnit === "metric") {
      return parseFloat(value) / 2.20462;
    }
    return parseFloat(value);
  };

  const prepareData = (measurements) => {
    const formattedDate = measurements.date
      ? dayjs(measurements.date).format("YYYY-MM-DD")
      : "";
    const weightValue = convertValue(measurements.weight, unit, "metric");
    return [
      formattedDate,
      weightValue || 0,
      parseFloat(measurements.neckRelaxed) || 0,
      parseFloat(measurements.shouldersRelaxed) || 0,
      parseFloat(measurements.chestRelaxed) || 0,
      parseFloat(measurements.chestFlexed) || 0,
      parseFloat(measurements.upperChestRelaxed) || 0,
      parseFloat(measurements.lowerChestRelaxed) || 0,
      parseFloat(measurements.leftUpperArmRelaxed) || 0,
      parseFloat(measurements.leftUpperArmFlexed) || 0,
      parseFloat(measurements.rightUpperArmRelaxed) || 0,
      parseFloat(measurements.rightUpperArmFlexed) || 0,
      parseFloat(measurements.leftForearmRelaxed) || 0,
      parseFloat(measurements.rightForearmRelaxed) || 0,
      parseFloat(measurements.leftWristRelaxed) || 0,
      parseFloat(measurements.rightWristRelaxed) || 0,
      parseFloat(measurements.waistRelaxed) || 0,
      parseFloat(measurements.abdomenRelaxed) || 0,
      parseFloat(measurements.hipsRelaxed) || 0,
      parseFloat(measurements.leftUpperThighRelaxed) || 0,
      parseFloat(measurements.rightUpperThighRelaxed) || 0,
      parseFloat(measurements.leftMidThighRelaxed) || 0,
      parseFloat(measurements.rightMidThighRelaxed) || 0,
      parseFloat(measurements.leftLowerThighRelaxed) || 0,
      parseFloat(measurements.rightLowerThighRelaxed) || 0,
      parseFloat(measurements.leftCalvesRelaxed) || 0,
      parseFloat(measurements.rightCalvesRelaxed) || 0,
      parseFloat(measurements.leftAnkleRelaxed) || 0,
      parseFloat(measurements.rightAnkleRelaxed) || 0,
    ];
  };

  const handleSave = async () => {
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
  };

  const handleSelectionChange = (group, value) => {
    setSelectedMeasurements((prev) => ({ ...prev, [group]: value }));
  };

  const dynamicChartData = {
    labels: logs ? logs.map((log) => log[0]) : [],
    datasets: Object.entries(selectedMeasurements).flatMap(([group, fields]) =>
      fields.map((field) => ({
        label: measurementLabels[field],
        data: logs
          ? logs.map(
              (log) =>
                parseFloat(log[Object.keys(measurements).indexOf(field)]) || 0
            )
          : [],
        backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
          Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 0.8)`,
      }))
    ),
  };

  const dynamicChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: themeMode === "dark" ? "#ffffff" : "#000000", // Adjusted for dark mode
        },
      },
      title: {
        display: true,
        text: "Selected Body Measurements Over Time",
        color: themeMode === "dark" ? "#ffffff" : "#000000", // Adjusted for dark mode
      },
    },
    scales: {
      x: {
        ticks: { color: themeMode === "dark" ? "#b0bec5" : "#000000" }, // Adjusted for dark mode
        grid: { color: themeMode === "dark" ? "#424242" : "#e0e0e0" }, // Adjusted for dark mode
      },
      y: {
        ticks: { color: themeMode === "dark" ? "#b0bec5" : "#000000" }, // Adjusted for dark mode
        grid: { color: themeMode === "dark" ? "#424242" : "#e0e0e0" }, // Adjusted for dark mode
        beginAtZero: true,
        title: {
          display: true,
          text: "Measurement (cm)",
          color: themeMode === "dark" ? "#ffffff" : "#000000", // Adjusted for dark mode
        },
      },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="main-container">
        <Box className="header">
          <Typography className="header-greeting">Body Measurements</Typography>
          <TextField
            className="header-search"
            placeholder="Search anything here..."
            variant="outlined"
            size="small"
          />
          <Box className="header-profile">
            <Avatar alt="User" src="/path-to-profile-pic.jpg" />
            <Typography>User Name</Typography>
          </Box>
        </Box>

        <Box className="card">
          <Typography className="card-title">Body Measurements</Typography>
          {loading ? (
            <Typography variant="h6" align="center">
              Loading...
            </Typography>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={unit}
                  exclusive
                  onChange={handleUnitChange}
                  aria-label="unit selection"
                >
                  <ToggleButton value="metric">Metric (kg/cm)</ToggleButton>
                  <ToggleButton value="imperial">
                    Imperial (lbs/in)
                  </ToggleButton>
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
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
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
                  />
                </Grid>
              </Grid>

              {!quickEntry && (
                <>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Upper Body</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {[
                          "neckRelaxed",
                          "shouldersRelaxed",
                          "chestRelaxed",
                          "chestFlexed",
                          "upperChestRelaxed",
                          "lowerChestRelaxed",
                        ].map((field) => (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              label={`${field.replace(/([A-Z])/g, " $1")} (cm)`}
                              name={field}
                              type="number"
                              value={measurements[field]}
                              onChange={handleInputChange}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Arms</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {[
                          "leftUpperArmRelaxed",
                          "leftUpperArmFlexed",
                          "rightUpperArmRelaxed",
                          "rightUpperArmFlexed",
                          "leftForearmRelaxed",
                          "rightForearmRelaxed",
                          "leftWristRelaxed",
                          "rightWristRelaxed",
                        ].map((field) => (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              label={`${field.replace(/([A-Z])/g, " $1")} (cm)`}
                              name={field}
                              type="number"
                              value={measurements[field]}
                              onChange={handleInputChange}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Torso</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {["waistRelaxed", "abdomenRelaxed", "hipsRelaxed"].map(
                          (field) => (
                            <Grid item xs={12} sm={6} key={field}>
                              <TextField
                                fullWidth
                                label={`${field.replace(
                                  /([A-Z])/g,
                                  " $1"
                                )} (cm)`}
                                name={field}
                                type="number"
                                value={measurements[field]}
                                onChange={handleInputChange}
                              />
                            </Grid>
                          )
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Legs</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {[
                          "leftUpperThighRelaxed",
                          "rightUpperThighRelaxed",
                          "leftMidThighRelaxed",
                          "rightMidThighRelaxed",
                          "leftLowerThighRelaxed",
                          "rightLowerThighRelaxed",
                          "leftCalvesRelaxed",
                          "rightCalvesRelaxed",
                          "leftAnkleRelaxed",
                          "rightAnkleRelaxed",
                        ].map((field) => (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              label={`${field.replace(/([A-Z])/g, " $1")} (cm)`}
                              name={field}
                              type="number"
                              value={measurements[field]}
                              onChange={handleInputChange}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
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

              <Box sx={{ mb: 2 }}>
                {["upperBody", "arms", "torso", "legs"].map((group) => (
                  <FormControl key={group} sx={{ m: 1, minWidth: 200 }}>
                    <InputLabel>{group.replace(/([A-Z])/g, " $1")}</InputLabel>
                    <Select
                      multiple
                      value={selectedMeasurements[group]}
                      onChange={(e) =>
                        handleSelectionChange(group, e.target.value)
                      }
                      renderValue={(selected) =>
                        selected
                          .map((field) => measurementLabels[field])
                          .join(", ")
                      }
                    >
                      {Object.keys(measurements)
                        .filter((field) =>
                          group === "upperBody"
                            ? ["chestRelaxed", "chestFlexed"].includes(field)
                            : group === "arms"
                            ? [
                                "leftUpperArmRelaxed",
                                "rightUpperArmRelaxed",
                              ].includes(field)
                            : group === "torso"
                            ? ["waistRelaxed", "abdomenRelaxed"].includes(field)
                            : [
                                "leftUpperThighRelaxed",
                                "rightUpperThighRelaxed",
                              ].includes(field)
                        )
                        .map((field) => (
                          <MenuItem key={field} value={field}>
                            {measurementLabels[field]}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>

              <Box className="chart-wrapper">
                <Bar data={dynamicChartData} options={dynamicChartOptions} />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default BodyMeasurements;
