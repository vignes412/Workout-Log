// src/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-page">
      <h1>Fitness Tracker</h1>
      <p>Welcome to your personal fitness tracker!</p>
      <nav>
        <Link to="/login">Login</Link>
        <Link to="/workout">Workout Log</Link>
        <Link to="/bodyweight">Bodyweight</Link>
        <Link to="/exercises">Exercise List</Link>
        <Link to="/app">Original App</Link>
      </nav>
    </div>
  );
};

export default Home;
