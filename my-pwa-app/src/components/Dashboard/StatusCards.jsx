import React from "react";
import { Box, Badge, Typography } from "@mui/material";
import { FitnessCenter } from "@mui/icons-material";
import { renderMuscleGroup } from "./MuscleGroupIcons";

const StatusCard = ({ isOffline, logsCount }) => {
  return (
    <div className="card">
      <Badge badgeContent={logsCount || 0} color="primary">
        <FitnessCenter sx={{ color: isOffline ? "error.main" : "success.main" }} />
      </Badge>
    </div>
  );
};

const TrainMusclesCard = ({ readyToTrain }) => {
  return (
    <div className="card">
      <Typography variant="subtitle1" sx={{ mb: 1, color: "primary.main", fontWeight: "bold" }}>
        TRAIN
      </Typography>
      <Box className="muscle-icon-container">
        {readyToTrain.length > 0 ? (
          readyToTrain.map((muscle, index) => (
            renderMuscleGroup(muscle) ? <Box key={`ready-${index}`}>{renderMuscleGroup(muscle)}</Box>: null
          ))
        ) : null}
      </Box>
    </div>
  );
};

const RestMusclesCard = ({ restMuscles }) => {
  return (
    <div className="card">
      <Typography variant="subtitle1" sx={{ mb: 1, color: "secondary.main", fontWeight: "bold" }}>
        REST
      </Typography>
      <Box className="muscle-icon-container">
        {restMuscles.length > 0 ? (
          restMuscles.map((muscle, index) => (
            renderMuscleGroup(muscle) ? <Box key={`rest-${index}`}>{renderMuscleGroup(muscle)}</Box> : null
          ))
        ) : null}
      </Box>
    </div>
  );
};

export { StatusCard, TrainMusclesCard, RestMusclesCard };