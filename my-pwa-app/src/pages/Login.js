import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button, Box, Typography } from "@mui/material";
import { useAppState } from "../index";
import "../styles.css";

const Login = ({ setIsAuthenticated, onNavigate }) => {
  const { dispatch } = useAppState();
  const token = localStorage.getItem("authToken");

  React.useEffect(() => {
    if (token) onNavigate("dashboard");
  }, [token, onNavigate]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token;
      localStorage.setItem("authToken", token);
      dispatch({
        type: "SET_AUTHENTICATION",
        payload: { isAuthenticated: true, accessToken: token },
      });
      onNavigate("dashboard");
    },
    onError: (error) => console.error("Login Failed:", error),
    scope:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets",
    flow: "implicit",
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
      <Box className="card" sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="h4" className="card-title" gutterBottom>
          Fitness Tracker
        </Typography>
        <Button variant="contained" color="primary" onClick={() => login()}>
          Login with Google
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
