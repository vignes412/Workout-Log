import React, { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button, Box, Typography, CircularProgress, Alert } from "@mui/material";
import { useAppState } from "../index";
import { exchangeCodeForTokens, isAuthenticated, getAccessToken } from "../services/authService";
import config from "../config";
import "../styles.css";

interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated, onNavigate }) => {
  const { dispatch } = useAppState();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      if (isAuthenticated()) {
        try {
          // Get a fresh access token if needed
          const token = await getAccessToken();
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: true, accessToken: token },
          });
          onNavigate("dashboard");
        } catch (error: any) {
          console.error("Authentication check failed:", error);
          // Continue to login page if token refresh fails
        }
      }
    };
    
    checkAuthStatus();
  }, [dispatch, onNavigate]);

  // Extract code from URL if present (for redirect after authorization)
  useEffect(() => {
    const handleAuthCodeRedirect = async (): Promise<void> => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      
      if (code) {
        setLoading(true);
        setError(null);
        
        try {
          // Exchange the code for tokens
          const tokenData = await exchangeCodeForTokens(code);
          
          // Update app state with the new tokens
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: true, accessToken: tokenData.access_token },
          });
          
          // Remove code from URL (prevent issues on refresh)
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Navigate to dashboard
          onNavigate("dashboard");
        } catch (err: any) {
          console.error("Code exchange failed:", err);
          setError("Authentication failed. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };
    
    handleAuthCodeRedirect();
  }, [dispatch, onNavigate]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse: any) => {
      console.log("Login Success - Code:", codeResponse.code);
      if (codeResponse.code) {
        // The code is already handled by the useEffect above through the redirect
        // This branch is for direct code returns without a page redirect
        setLoading(true);
        setError(null);
        
        exchangeCodeForTokens(codeResponse.code)
          .then(tokenData => {
            dispatch({
              type: "SET_AUTHENTICATION",
              payload: { isAuthenticated: true, accessToken: tokenData.access_token },
            });
            onNavigate("dashboard");
          })
          .catch((err: any) => {
            console.error("Code exchange failed:", err);
            setError("Authentication failed. Please try again.");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    },
    onError: (error: any) => {
      console.error("Login Failed:", error);
      setError("Login failed. Please try again.");
    },
    flow: "auth-code",
    scope: config.google.SCOPES,
    // Enable offline access to get refresh tokens
    access_type: "offline",
    // Force consent to ensure refresh token is provided
    prompt: "consent",
  });

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      <Box className="card" sx={{ textAlign: "center", p: 4, maxWidth: "400px", width: "100%" }}>
        <Typography variant="h4" className="card-title" gutterBottom>
          Fitness Tracker
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <CircularProgress sx={{ my: 2 }} />
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => login()}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Login with Google
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Login;