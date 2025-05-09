import { useState, useCallback, useEffect, ChangeEvent } from "react";
import { initialMeasurements, defaultSelectedMeasurements, MeasurementKey, MeasurementGroup, SelectedMeasurements } from "../constants/measurementConstants";
import { fetchData, saveBodyMeasurementToSheet } from "../utils/sheetsApi";
import { Measurement } from "../types";
import dayjs, { Dayjs } from "dayjs";

// Define the unit type for measurements
type MeasurementUnit = "metric" | "imperial";

// Define the return type for the hook
interface UseMeasurementsReturn {
  measurements: Measurement;
  logs: any[];
  saveStatus: string;
  error: string;
  loading: boolean;
  quickEntry: boolean;
  unit: MeasurementUnit;
  selectedMeasurements: SelectedMeasurements;
  setMeasurements: React.Dispatch<React.SetStateAction<Measurement>>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleUnitChange: (event: React.MouseEvent<HTMLElement>, newUnit: MeasurementUnit | null) => void;
  handleSave: () => Promise<void>;
  handleSelectionChange: (group: MeasurementGroup, value: MeasurementKey[]) => void;
  toggleQuickEntry: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (newValue: Dayjs | null) => void; // Changed from Date to Dayjs
  convertValue: (value: string | number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit) => number;
}

const useMeasurements = (accessToken: string | null): UseMeasurementsReturn => {
  const [measurements, setMeasurements] = useState<Measurement>({...initialMeasurements});
  const [logs, setLogs] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [quickEntry, setQuickEntry] = useState<boolean>(true);
  const [unit, setUnit] = useState<MeasurementUnit>("metric");
  const [selectedMeasurements, setSelectedMeasurements] = useState<SelectedMeasurements>({...defaultSelectedMeasurements});

  // Reset measurements to initial state
  const resetMeasurements = useCallback((): Measurement => ({...initialMeasurements}), []);

  // Load measurements data from the API
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const response = await fetchData("Body_Measurements!A2:AC");
        setLogs(response.success ? response.data || [] : []);
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
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (name !== "date" && value && isNaN(Number(value))) {
      setError(`${name} must be a valid number.`);
      return;
    }
    setMeasurements((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  // Handle unit change between metric and imperial
  const handleUnitChange = useCallback((event: React.MouseEvent<HTMLElement>, newUnit: MeasurementUnit | null): void => {
    if (newUnit) setUnit(newUnit);
  }, []);

  // Toggle quick entry mode
  const toggleQuickEntry = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setQuickEntry(!e.target.checked);
  }, [quickEntry]);

  // Convert values between units
  const convertValue = useCallback((value: string | number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number => {
    if (!value) return 0;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (fromUnit === toUnit) return numValue;
    if (fromUnit === "metric" && toUnit === "imperial") {
      return numValue * 2.20462;
    } else if (fromUnit === "imperial" && toUnit === "metric") {
      return numValue / 2.20462;
    }
    return numValue;
  }, []);

  // Prepare data for saving to the sheet
  const prepareData = useCallback((measurements: Measurement): (string | number)[] => {
    const formattedDate = measurements.date
      ? dayjs(measurements.date).format("YYYY-MM-DD")
      : "";
    const weightValue = convertValue(measurements.weight, unit, "metric");
    
    return [
      formattedDate,
      weightValue || 0,
      ...Object.keys(initialMeasurements)
        .filter(key => key !== 'date' && key !== 'weight')
        .map(key => parseFloat(String(measurements[key])) || 0)
    ];
  }, [convertValue, unit]);

  // Save measurement data
  const handleSave = useCallback(async (): Promise<void> => {
    if (!measurements.date || !measurements.weight) {
      setError("Date and Weight are required fields.");
      setSaveStatus("");
      return;
    }

    try {
      const row = prepareData(measurements);
      if (!accessToken) {
        throw new Error("Not authenticated");
      }
      
      await saveBodyMeasurementToSheet({
        weight: row[1] || 0,
        bodyFat: row[2] || 0,
        chest: row[3] || 0,
        waist: row[4] || 0,
        hip: row[5] || 0,
        rightArm: row[6] || 0,
        leftArm: row[7] || 0,
        rightThigh: row[8] || 0,
        leftThigh: row[9] || 0,
        rightCalf: row[10] || 0,
        leftCalf: row[11] || 0,
        notes: row[12] || ''
      });
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
  const handleDateChange = useCallback((newValue: Dayjs | null): void => {
    setMeasurements((prev) => ({ ...prev, date: newValue }));
  }, []);

  // Change selected measurements for the chart
  const handleSelectionChange = useCallback((group: MeasurementGroup, value: MeasurementKey[]): void => {
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