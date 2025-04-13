import React from "react";
import { Snackbar, Alert } from "@mui/material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", open: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message, open: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
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
