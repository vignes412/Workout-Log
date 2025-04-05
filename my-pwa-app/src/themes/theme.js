// src/themes/theme.js
import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#2c3e50",
      secondary: "#7f8c8d",
    },
    error: { main: "#ef5350" },
    success: { main: "#4caf50" },
    info: { main: "#2196f3" },
    divider: "rgba(0, 0, 0, 0.12)",
    action: {
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h1: { color: "#2c3e50" },
    h5: { color: "#2c3e50" },
    h6: { color: "#2c3e50" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          borderRadius: "12px",
          transition: "box-shadow 0.3s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "4px",
          transition: "background-color 0.3s ease, transform 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#1976d2",
            },
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#63b3ed" },
    secondary: { main: "#f06292" },
    background: {
      default: "#1a202c",
      paper: "#2d3748",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#a0aec0",
    },
    error: { main: "#f56565" },
    success: { main: "#68d391" },
    info: { main: "#63b3ed" },
    divider: "rgba(255, 255, 255, 0.12)",
    action: {
      hover: "rgba(255, 255, 255, 0.08)",
      selected: "rgba(255, 255, 255, 0.16)",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h1: { color: "#e2e8f0" },
    h5: { color: "#e2e8f0" },
    h6: { color: "#e2e8f0" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          borderRadius: "12px",
          transition: "box-shadow 0.3s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "4px",
          transition: "background-color 0.3s ease, transform 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#63b3ed",
            },
          },
        },
      },
    },
  },
});
