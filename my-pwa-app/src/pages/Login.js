import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@mui/material";

const Login = ({ setIsAuthenticated, setAccessToken, onNavigate }) => {
  const token = localStorage.getItem("authToken");

  React.useEffect(() => {
    if (token) onNavigate("dashboard");
  }, [token, onNavigate]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.access_token;
      localStorage.setItem("authToken", token);
      setAccessToken(token);
      setIsAuthenticated(true);
      onNavigate("dashboard");
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
