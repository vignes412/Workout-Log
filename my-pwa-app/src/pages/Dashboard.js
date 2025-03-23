import React, { useState, useEffect, useMemo, useRef } from "react";
import { googleLogout } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { initClient, syncData, useOnlineStatus } from "../utils/sheetsApi";
import WorkoutLogModal from "./WorkoutLogModal";
import {
  Button,
  Typography,
  Grid,
  Fab,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  ArrowUpward,
  ArrowDownward,
  CompareArrows,
  Add,
} from "@mui/icons-material";
import * as d3 from "d3";

const computeDailyMetrics = (logs) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

  const grouped = {};
  logs.forEach((log) => {
    const key = `${log[0]}_${log[1]}_${log[2]}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  const sortedGroups = Object.entries(grouped)
    .map(([key, sessionLogs], index) => {
      const [date, muscleGroup, exercise] = key.split("_");
      const totalVolume = sessionLogs
        .reduce((sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]), 0)
        .toFixed(2);
      const totalSets = sessionLogs.length;
      const totalReps = sessionLogs
        .reduce((sum, log) => sum + parseFloat(log[3]), 0)
        .toFixed(2);
      const averageReps = (totalReps / totalSets).toFixed(2);
      const averageWeight = (
        sessionLogs.reduce((sum, log) => sum + parseFloat(log[4]), 0) /
        totalSets
      ).toFixed(2);
      const averageFatigue = (
        sessionLogs.reduce((sum, log) => sum + parseFloat(log[5]), 0) /
        totalSets
      ).toFixed(2);
      const maxWeight = Math.max(
        ...sessionLogs.map((log) => parseFloat(log[4]))
      );

      return {
        id: index + 1,
        date,
        muscleGroup,
        exercise,
        totalVolume,
        totalSets,
        totalReps,
        averageReps,
        averageWeight,
        averageFatigue,
        maxWeight,
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const muscleExerciseMap = {};
  sortedGroups.forEach((current, index) => {
    const key = `${current.muscleGroup}_${current.exercise}`;
    if (muscleExerciseMap[key]) {
      const prevVolume = muscleExerciseMap[key].totalVolume;
      const currentVolume = parseFloat(current.totalVolume);
      const progressionRate = prevVolume
        ? (((currentVolume - prevVolume) / prevVolume) * 100).toFixed(2)
        : "N/A";
      sortedGroups[index].progressionRate = progressionRate;
    } else {
      sortedGroups[index].progressionRate = "N/A";
    }
    muscleExerciseMap[key] = current;
  });

  return sortedGroups;
};

// 1. Line Chart for Total Volume
const LineChart = ({ data, field, label }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d[field]))])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text(label);

    const line = d3
      .line()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(parseFloat(d[field])));
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data, field, label]);
  return <svg ref={ref}></svg>;
};

// 2. Area Chart for Total Reps
const AreaChart = ({ data, field, label }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d[field]))])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text(label);

    const area = d3
      .area()
      .x((d) => x(new Date(d.date)))
      .y0(height)
      .y1((d) => y(parseFloat(d[field])));
    g.append("path")
      .datum(data)
      .attr("fill", "lightblue")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1)
      .attr("d", area);
  }, [data, field, label]);
  return <svg ref={ref}></svg>;
};

// 3. Bar Chart for Total Sets
const BarChart = ({ data, field, label }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.date))
      .range([0, width])
      .padding(0.1);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d[field]))])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text(label);

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.date))
      .attr("y", (d) => y(parseFloat(d[field])))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(parseFloat(d[field])))
      .attr("fill", "steelblue");
  }, [data, field, label]);
  return <svg ref={ref}></svg>;
};

// 4. Stacked Bar Chart for Average Reps and Weight
const StackedBarChart = ({ data }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.date))
      .range([0, width])
      .padding(0.1);
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(
          data,
          (d) => parseFloat(d.averageReps) + parseFloat(d.averageWeight)
        ),
      ])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Avg Reps + Weight");

    const stack = d3.stack().keys(["averageReps", "averageWeight"]);
    const stackedData = stack(
      data.map((d) => ({
        date: d.date,
        averageReps: parseFloat(d.averageReps),
        averageWeight: parseFloat(d.averageWeight),
      }))
    );

    g.selectAll(".stack")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("fill", (d, i) => (i === 0 ? "steelblue" : "lightblue"))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.date))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());
  }, [data]);
  return <svg ref={ref}></svg>;
};

// 5. Scatter Plot for Max Weight vs Average Fatigue
const ScatterPlot = ({ data }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d.maxWeight))])
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d.averageFatigue))])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Max Weight");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Avg Fatigue");

    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(parseFloat(d.maxWeight)))
      .attr("cy", (d) => y(parseFloat(d.averageFatigue)))
      .attr("r", 4)
      .attr("fill", "steelblue");
  }, [data]);
  return <svg ref={ref}></svg>;
};

// 6. Grouped Bar Chart for Total Volume by Muscle Group
const GroupedBarChart = ({ data }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dates = [...new Set(data.map((d) => d.date))];
    const muscleGroups = [...new Set(data.map((d) => d.muscleGroup))];
    const x0 = d3.scaleBand().domain(dates).range([0, width]).padding(0.2);
    const x1 = d3
      .scaleBand()
      .domain(muscleGroups)
      .range([0, x0.bandwidth()])
      .padding(0.05);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => parseFloat(d.totalVolume))])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Total Volume");

    const color = d3
      .scaleOrdinal()
      .domain(muscleGroups)
      .range(d3.schemeCategory10);
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x0(d.date) + x1(d.muscleGroup))
      .attr("y", (d) => y(parseFloat(d.totalVolume)))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(parseFloat(d.totalVolume)))
      .attr("fill", (d) => color(d.muscleGroup));
  }, [data]);
  return <svg ref={ref}></svg>;
};

// 7. Multi-Line Chart for Progression Rate
const MultiLineChart = ({ data }) => {
  const ref = useRef();
  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(ref.current).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const filteredData = data.filter((d) => d.progressionRate !== "N/A");
    if (filteredData.length === 0) return;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(filteredData, (d) => new Date(d.date)))
      .range([0, width]);
    const y = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => parseFloat(d.progressionRate)))
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .text("Date");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Progression Rate (%)");

    const line = d3
      .line()
      .x((d) => x(new Date(d.date)))
      .y((d) => y(parseFloat(d.progressionRate)));
    g.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [data]);
  return <svg ref={ref}></svg>;
};

const Dashboard = ({ isAuthenticated, setIsAuthenticated, accessToken }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [logs, setLogs] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useOnlineStatus(setIsOffline);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", setLogs),
            syncData(
              "Exercises!A2:B",
              "/api/exercises",
              setExercises,
              (row) => ({
                muscleGroup: row[0],
                exercise: row[1],
              })
            ),
          ]);
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, accessToken, isOffline]);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const workoutLogRows = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return logs.map((log, index) => ({
      id: index + 1,
      date: log[0],
      muscleGroup: log[1],
      exercise: log[2],
      reps: parseFloat(log[3]),
      weight: parseFloat(log[4]),
      rating: parseFloat(log[5]),
    }));
  }, [logs]);

  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  const workoutLogColumns = [
    { field: "date", headerName: "Date", width: 120, sortable: true },
    {
      field: "muscleGroup",
      headerName: "Muscle Group",
      width: 150,
      sortable: true,
    },
    { field: "exercise", headerName: "Exercise", width: 150, sortable: true },
    { field: "reps", headerName: "Reps", width: 100, sortable: true },
    { field: "weight", headerName: "Weight", width: 100, sortable: true },
    { field: "rating", headerName: "Rating", width: 100, sortable: true },
  ];

  const summaryColumns = [
    { field: "date", headerName: "Date", width: 120, sortable: true },
    {
      field: "muscleGroup",
      headerName: "Muscle Group",
      width: 150,
      sortable: true,
    },
    { field: "exercise", headerName: "Exercise", width: 150, sortable: true },
    {
      field: "totalVolume",
      headerName: "Total Volume",
      width: 120,
      sortable: true,
    },
    {
      field: "totalSets",
      headerName: "Total Sets",
      width: 100,
      sortable: true,
    },
    {
      field: "totalReps",
      headerName: "Total Reps",
      width: 100,
      sortable: true,
    },
    {
      field: "averageReps",
      headerName: "Avg Reps",
      width: 100,
      sortable: true,
    },
    {
      field: "averageWeight",
      headerName: "Avg Weight",
      width: 120,
      sortable: true,
    },
    {
      field: "averageFatigue",
      headerName: "Avg Fatigue",
      width: 120,
      sortable: true,
    },
    {
      field: "maxWeight",
      headerName: "Max Weight",
      width: 120,
      sortable: true,
    },
    {
      field: "progressionRate",
      headerName: "Progression Rate (%)",
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const value = params.value;
        if (value === "N/A") {
          return (
            <span style={{ color: "blue" }}>
              <CompareArrows /> N/A
            </span>
          );
        }
        const numValue = parseFloat(value);
        if (numValue > 0) {
          return (
            <span style={{ color: "green" }}>
              <ArrowUpward /> {value}
            </span>
          );
        } else if (numValue < 0) {
          return (
            <span style={{ color: "red" }}>
              <ArrowDownward /> {value}
            </span>
          );
        } else {
          return (
            <span style={{ color: "blue" }}>
              <CompareArrows /> {value}
            </span>
          );
        }
      },
    },
  ];

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <div style={{ padding: "20px", flexGrow: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Status: {isOffline ? "Offline" : "Online"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Workout Logs
            </Typography>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={workoutLogRows}
                columns={workoutLogColumns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: {
                    sortModel: [{ field: "date", sort: "desc" }],
                  },
                }}
                pageSizeOptions={[5, 10, 20]}
                slots={{ toolbar: GridToolbar }}
                sortingOrder={["asc", "desc"]}
                filterMode="client"
                sortingMode="client"
                paginationMode="client"
              />
            </div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Workout Summary by Date, Muscle Group, and Exercise
            </Typography>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={dailyMetrics}
                columns={summaryColumns}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                  sorting: {
                    sortModel: [{ field: "date", sort: "desc" }],
                  },
                }}
                pageSizeOptions={[5, 10, 20]}
                slots={{ toolbar: GridToolbar }}
                sortingOrder={["asc", "desc"]}
                filterMode="client"
                sortingMode="client"
                paginationMode="client"
              />
            </div>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Workout Summary Charts
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">Total Volume Over Time</Typography>
            <div style={{ height: 250, width: "100%" }}>
              <LineChart
                data={dailyMetrics}
                field="totalVolume"
                label="Total Volume"
              />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">Total Reps Over Time</Typography>
            <div style={{ height: 250, width: "100%" }}>
              <AreaChart
                data={dailyMetrics}
                field="totalReps"
                label="Total Reps"
              />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">Total Sets per Date</Typography>
            <div style={{ height: 250, width: "100%" }}>
              <BarChart
                data={dailyMetrics}
                field="totalSets"
                label="Total Sets"
              />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">
              Avg Reps and Weight (Stacked)
            </Typography>
            <div style={{ height: 250, width: "100%" }}>
              <StackedBarChart data={dailyMetrics} />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">
              Max Weight vs Avg Fatigue
            </Typography>
            <div style={{ height: 250, width: "100%" }}>
              <ScatterPlot data={dailyMetrics} />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">
              Total Volume by Muscle Group
            </Typography>
            <div style={{ height: 250, width: "100%" }}>
              <GroupedBarChart data={dailyMetrics} />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1">
              Progression Rate Over Time
            </Typography>
            <div style={{ height: 250, width: "100%" }}>
              <MultiLineChart data={dailyMetrics} />
            </div>
          </Grid>
        </Grid>
      </div>

      <Fab
        color="primary"
        onClick={handleMenuOpen}
        sx={{ position: "fixed", bottom: 20, right: 20 }}
      >
        <Add />
      </Fab>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MenuItem
          onClick={() => {
            setOpenModal(true);
            handleMenuClose();
          }}
        >
          Workout Log
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Body Weight</MenuItem>
        <MenuItem onClick={handleMenuClose}>Exercise</MenuItem>
      </Menu>

      <WorkoutLogModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        exercises={exercises}
        isOffline={isOffline}
      />
    </div>
  );
};

export default Dashboard;
