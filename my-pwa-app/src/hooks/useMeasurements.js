import { useState, useCallback, useEffect } from "react";
import { initialMeasurements, defaultSelectedMeasurements } from "../constants/measurementConstants";
import { fetchData, saveBodyMeasurementToSheet } from "../utils/sheetsApi";
import dayjs from "dayjs";

const useMeasurements = (accessToken) => {
  const [measurements, setMeasurements] = useState({...initialMeasurements});
  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickEntry, setQuickEntry] = useState(true);
  const [unit, setUnit] = useState("metric");
  const [selectedMeasurements, setSelectedMeasurements] = useState({...defaultSelectedMeasurements});

  // Reset measurements to initial state
  const resetMeasurements = useCallback(() => ({...initialMeasurements}), []);

  // Load measurements data from the API
  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const data = await fetchData("Body_Measurements!A2:AC");
        setLogs(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load measurements from spreadsheet.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name !== "date" && value && isNaN(value)) {
      setError(`${name} must be a valid number.`);
      return;
    }
    setMeasurements((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  // Handle unit change between metric and imperial
  const handleUnitChange = useCallback((event, newUnit) => {
    if (newUnit) setUnit(newUnit);
  }, []);

  // Toggle quick entry mode
  const toggleQuickEntry = useCallback((e) => {
    setQuickEntry(!e.target.checked);
  }, [quickEntry]);

  // Convert values between units
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

  // Prepare data for saving to the sheet
  const prepareData = useCallback((measurements) => {
    const formattedDate = measurements.date
      ? dayjs(measurements.date).format("YYYY-MM-DD")
      : "";
    const weightValue = convertValue(measurements.weight, unit, "metric");
    
    return [
      formattedDate,
      weightValue || 0,
      ...Object.keys(initialMeasurements)
        .filter(key => key !== 'date' && key !== 'weight')
        .map(key => parseFloat(measurements[key]) || 0)
    ];
  }, [convertValue, unit]);

  // Save measurement data
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
      setLogs((prev) => [...prev, row]);
      setMeasurements(resetMeasurements());
      setSaveStatus("Measurements saved successfully!");
      setError("");
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save measurements. Please try again.");
      setSaveStatus("");
    }
  }, [accessToken, measurements, prepareData, resetMeasurements]);

  // Update date measurement
  const handleDateChange = useCallback((newValue) => {
    setMeasurements((prev) => ({ ...prev, date: newValue }));
  }, []);

  // Change selected measurements for the chart
  const handleSelectionChange = useCallback((group, value) => {
    setSelectedMeasurements((prev) => ({ ...prev, [group]: value }));
  }, []);

  return {
    measurements,
    logs,
    saveStatus,
    error,
    loading,
    quickEntry,
    unit,
    selectedMeasurements,
    setMeasurements,
    handleInputChange,
    handleUnitChange,
    handleSave,
    handleSelectionChange,
    toggleQuickEntry,
    handleDateChange,
    convertValue
  };
};

export default useMeasurements;