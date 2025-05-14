import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Container,
  Alert,
  Snackbar,
  Link,
} from "@mui/material";
import { Google, FitnessCenter } from "@mui/icons-material";
import {
  exchangeCodeForTokens,
  generateAuthUrl,
  isAuthenticated,
  getAccessToken,
  initiateAuthCodeFlow,
} from "../services/authService";
import "../styles/login.css";

interface LoginProps {
  setIsAuthenticated: (isAuth: boolean, accessToken?: string) => void;
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated, onNavigate }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info" as "info" | "error" | "success" | "warning",
  });

  // Improved authentication check with retry logic and rate limiting
  const checkAuth = useCallback(async () => {
    if (isLoading && retryAttempt < 3) { // Limit retry attempts
      try {
        if (isAuthenticated()) {
          try {
            const token = await getAccessToken();
            if (token) {
              setIsAuthenticated(true, token);
              onNavigate("dashboard");
              return;
            }
          } catch (error) {
            console.warn("Token refresh during initial auth check failed:", error);
            // Continue with the flow to handle login
          }
        }
        
        // Check for 'code' in URL (OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (code) {
          setIsLoading(true);
          
          try {
            // Clean URL and remove code to prevent reuse
            window.history.replaceState({}, document.title, window.location.pathname);
            
            console.log("Found authorization code in URL, attempting to exchange for tokens");
            
            // Exchange the code for tokens
            const tokenResult = await exchangeCodeForTokens(code);
            
            if (tokenResult && tokenResult.access_token) {
              setIsAuthenticated(true, tokenResult.access_token);
              onNavigate("dashboard");
              
              // Show success toast
              setToast({
                open: true,
                message: "Login successful!",
                severity: "success",
              });
              return;
            } else {
              throw new Error("Failed to obtain access token");
            }
          } catch (error) {
            console.error("Error exchanging code for tokens:", error);
            setAuthError(error instanceof Error ? error.message : "Login failed. Please try again.");
            
            setToast({
              open: true,
              message: "Login failed. Please try again.",
              severity: "error",
            });
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
        setAuthError("Authentication error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [isLoading, onNavigate, retryAttempt, setIsAuthenticated]);

  // Check authentication on component mount with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, retryAttempt * 100); // Incremental backoff

    return () => clearTimeout(timer);
  }, [checkAuth, retryAttempt]);

  // Handle retry with backoff
  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setAuthError(null);
    setRetryAttempt((prev) => prev + 1);
  }, []);

  // Handle Google sign-in button click
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use initiateAuthCodeFlow instead of generateAuthUrl for the improved version
      await initiateAuthCodeFlow();
      // No need to set window.location.href as initiateAuthCodeFlow handles it
    } catch (error) {
      console.error("Error initiating auth flow:", error);
      setAuthError("Failed to initialize Google login. Please try again.");
      setIsLoading(false);
      
      setToast({
        open: true,
        message: "Failed to initialize Google login. Please try again.",
        severity: "error",
      });
    }
  }, []);

  return (
    <Container maxWidth="sm" className="login-container">
      <Paper elevation={3} className="login-paper">
        <Box className="logo-container">
          <FitnessCenter color="primary" fontSize="large" />
          <Typography variant="h4" component="h1" className="logo-text">
            Workout Log
          </Typography>
        </Box>

        <Typography variant="h6" className="login-subtitle">
          Track your fitness progress
        </Typography>

        {authError && (
          <Alert severity="error" className="auth-error">
            {authError}
            <Button 
              size="small" 
              onClick={handleRetry} 
              color="inherit" 
              style={{ marginLeft: '10px' }}
            >
              Retry
            </Button>
          </Alert>
        )}

        <Box className="login-button-container">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Google />}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="google-signin-button"
            size="large"
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign in with Google"
            )}
          </Button>
        </Box>

        <Typography variant="body2" className="login-info">
          Sign in to access your workout data and track your progress.
          Your data is stored securely in your Google account.
        </Typography>

        <Typography variant="caption" className="privacy-policy">
          By signing in, you agree to our{" "}
          <Link href="#" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="#" onClick={(e) => e.preventDefault()}>
            Terms of Service
          </Link>
          .
        </Typography>
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;