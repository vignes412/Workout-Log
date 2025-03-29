import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  FormControlLabel,
  Checkbox,
  AppBar,
  Toolbar,
} from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useAppState } from "../index";
import { syncData, appendData2 } from "../utils/sheetsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BodyMeasurements = ({ accessToken, onNavigate, themeMode }) => {
  const { logs, setLogs } = useAppState();
  const [measurements, setMeasurements] = useState({
    date: "",
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
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [fullEntry, setFullEntry] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await syncData("Body_Measurements!A2:AC", "/api/measurements", setLogs);
      } catch (err) {
        setError("Failed to load measurements: " + err.message);
      }
    };
    if (accessToken) fetchData();
  }, [accessToken, setLogs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeasurements((prev) => ({ ...prev, [name]: value }));
  };

  const prepareData = (measurements) => {
    return [
      new Date(measurements.date).toISOString().split("T")[0],
      parseFloat(measurements.weight) || 0,
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
    try {
      const row = prepareData(measurements);
      console.log("Data being sent:", row);
      await appendData2("Body_Measurements!A2:AC", [row], accessToken);
      setLogs((prev) => [...prev, row]);
      setMeasurements({
        date: "",
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
      setSaveStatus("Measurements saved successfully!");
      setError("");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save measurements: " + err.message);
      setSaveStatus("");
    }
  };

  const graphData = {
    labels: logs ? logs.map((log) => log[0]) : [],
    datasets: [
      {
        label: "Weight (kg)",
        data: logs ? logs.map((log) => parseFloat(log[1]) || 0) : [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Chest Relaxed (cm)",
        data: logs ? logs.map((log) => parseFloat(log[4]) || 0) : [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Waist Relaxed (cm)",
        data: logs ? logs.map((log) => parseFloat(log[16]) || 0) : [],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Hips Relaxed (cm)",
        data: logs ? logs.map((log) => parseFloat(log[18]) || 0) : [],
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
      {
        label: "Left Arm Flexed (cm)",
        data: logs ? logs.map((log) => parseFloat(log[9]) || 0) : [],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
      {
        label: "Right Thigh Mid (cm)",
        data: logs ? logs.map((log) => parseFloat(log[21]) || 0) : [],
        backgroundColor: "rgba(255, 159, 64, 0.6)",
      },
    ],
  };

  const graphOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Body Measurements Over Time" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Measurement (kg/cm)" },
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Button color="inherit" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
            Body Measurements
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper elevation={3} sx={{ p: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={fullEntry}
              onChange={(e) => setFullEntry(e.target.checked)}
            />
          }
          label="Full Entry (Include All Measurements)"
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date (DD/MM/YYYY)"
              name="date"
              value={measurements.date}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Weight (kg)"
              name="weight"
              type="number"
              value={measurements.weight}
              onChange={handleInputChange}
              required
            />
          </Grid>
          {fullEntry && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Neck Relaxed (cm)"
                  name="neckRelaxed"
                  type="number"
                  value={measurements.neckRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shoulders Relaxed (cm)"
                  name="shouldersRelaxed"
                  type="number"
                  value={measurements.shouldersRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Chest Relaxed (cm)"
                  name="chestRelaxed"
                  type="number"
                  value={measurements.chestRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Chest Flexed (cm)"
                  name="chestFlexed"
                  type="number"
                  value={measurements.chestFlexed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Upper Chest Relaxed (cm)"
                  name="upperChestRelaxed"
                  type="number"
                  value={measurements.upperChestRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lower Chest Relaxed (cm)"
                  name="lowerChestRelaxed"
                  type="number"
                  value={measurements.lowerChestRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Upper Arm Relaxed (cm)"
                  name="leftUpperArmRelaxed"
                  type="number"
                  value={measurements.leftUpperArmRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Upper Arm Flexed (cm)"
                  name="leftUpperArmFlexed"
                  type="number"
                  value={measurements.leftUpperArmFlexed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Upper Arm Relaxed (cm)"
                  name="rightUpperArmRelaxed"
                  type="number"
                  value={measurements.rightUpperArmRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Upper Arm Flexed (cm)"
                  name="rightUpperArmFlexed"
                  type="number"
                  value={measurements.rightUpperArmFlexed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Forearm Relaxed (cm)"
                  name="leftForearmRelaxed"
                  type="number"
                  value={measurements.leftForearmRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Forearm Relaxed (cm)"
                  name="rightForearmRelaxed"
                  type="number"
                  value={measurements.rightForearmRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Wrist Relaxed (cm)"
                  name="leftWristRelaxed"
                  type="number"
                  value={measurements.leftWristRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Wrist Relaxed (cm)"
                  name="rightWristRelaxed"
                  type="number"
                  value={measurements.rightWristRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Waist Relaxed (cm)"
                  name="waistRelaxed"
                  type="number"
                  value={measurements.waistRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Abdomen Relaxed (cm)"
                  name="abdomenRelaxed"
                  type="number"
                  value={measurements.abdomenRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hips Relaxed (cm)"
                  name="hipsRelaxed"
                  type="number"
                  value={measurements.hipsRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Upper Thigh Relaxed (cm)"
                  name="leftUpperThighRelaxed"
                  type="number"
                  value={measurements.leftUpperThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Upper Thigh Relaxed (cm)"
                  name="rightUpperThighRelaxed"
                  type="number"
                  value={measurements.rightUpperThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Mid Thigh Relaxed (cm)"
                  name="leftMidThighRelaxed"
                  type="number"
                  value={measurements.leftMidThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Mid Thigh Relaxed (cm)"
                  name="rightMidThighRelaxed"
                  type="number"
                  value={measurements.rightMidThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Lower Thigh Relaxed (cm)"
                  name="leftLowerThighRelaxed"
                  type="number"
                  value={measurements.leftLowerThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Lower Thigh Relaxed (cm)"
                  name="rightLowerThighRelaxed"
                  type="number"
                  value={measurements.rightLowerThighRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Calves Relaxed (cm)"
                  name="leftCalvesRelaxed"
                  type="number"
                  value={measurements.leftCalvesRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Calves Relaxed (cm)"
                  name="rightCalvesRelaxed"
                  type="number"
                  value={measurements.rightCalvesRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Left Ankle Relaxed (cm)"
                  name="leftAnkleRelaxed"
                  type="number"
                  value={measurements.leftAnkleRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Right Ankle Relaxed (cm)"
                  name="rightAnkleRelaxed"
                  type="number"
                  value={measurements.rightAnkleRelaxed}
                  onChange={handleInputChange}
                />
              </Grid>
            </>
          )}
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
      </Paper>

      {logs && logs.length > 0 && (
        <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
          <Box sx={{ height: 400 }}>
            <Bar data={graphData} options={graphOptions} />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BodyMeasurements;
