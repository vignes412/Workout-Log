// src/pages/Login.js
import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

const Login = ({ setIsAuthenticated, setAccessToken }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  React.useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token;
      localStorage.setItem("authToken", token);
      setAccessToken(token);
      setIsAuthenticated(true);
      navigate("/dashboard");
    },
    onError: (error) => console.error("Login Failed:", error),
    scope:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/spreadsheets",
    flow: "implicit",
  });

  return (
    <div className="login-page">
      <h1>Fitness Tracker</h1>
      <Button variant="contained" color="primary" onClick={() => login()}>
        Login with Google
      </Button>
    </div>
  );
};

export default Login;
