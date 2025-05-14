import React, { ErrorInfo } from "react";
import { Snackbar, Alert } from "@mui/material";
import { ErrorBoundaryProps } from "../types";

// Define the state interface
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  open: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "", open: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message, open: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Caught error:", error, errorInfo);
    if (this.props.onNavigate) {
      this.props.onNavigate("login"); // Redirect to login using onNavigate
    }
  }

  handleClose = (): void => {
    this.setState({ open: false });
  };

  render(): React.ReactNode {
    return (
      <>
        <Snackbar
          open={this.state.open}
          autoHideDuration={6000}
          onClose={this.handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={this.handleClose}
            severity="error"
            sx={{ width: "100%" }}
          >
            Something went wrong: {this.state.errorMessage}
          </Alert>
        </Snackbar>
        {this.props.children}
      </>
    );
  }
}

export default ErrorBoundary;