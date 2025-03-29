import React from "react";
import { Typography, Button } from "@mui/material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Typography variant="h6" color="error">
            Something went wrong: {this.state.errorMessage}
          </Typography>
          <Button
            variant="contained"
            onClick={() => this.setState({ hasError: false })}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
