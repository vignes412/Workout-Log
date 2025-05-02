import React from "react";
import { Box } from "@mui/material";

// Importing muscle group icons
import shouldeIcon from "../../assets/shoulder.png";
import absIcon from "../../assets/Abdominals.png";
import ChestIcon from "../../assets/chest.png";
import TricepsIcon from "../../assets/triceps.png";
import trapeziusIcon from "../../assets/trapezius.png";
import bicepsIcon from "../../assets/biceps.png";
import forearmIcon from "../../assets/forearm.png";
import calfIcon from "../../assets/calf.png";
import HipIcon from "../../assets/Hip.png";
import backWingsIcon from "../../assets/back-wings.png";
import neckIcon from "../../assets/neck.png";
import LegIcon from "../../assets/leg.png";

export const muscleGroupIcons = {
  Abs: <img src={absIcon} alt="Abs" className="muscleGroupIcon" />,
//   "Full Body": (
//     <img src={ChestIcon} alt="Full Body" className="muscleGroupIcon" />
//   ),
  Hip: <img src={HipIcon} alt="Hip" className="muscleGroupIcon" />,
  Triceps: <img src={TricepsIcon} alt="Triceps" className="muscleGroupIcon" />,
  Chest: <img src={ChestIcon} alt="Chest" className="muscleGroupIcon" />,
  Leg: <img src={LegIcon} alt="Leg" className="muscleGroupIcon" />,
  Shoulders: (
    <img src={shouldeIcon} alt="Shoulders" className="muscleGroupIcon" />
  ),
//   Cardio: <img src={ChestIcon} alt="Cardio" className="muscleGroupIcon" />,
  Biceps: <img src={bicepsIcon} alt="Biceps" className="muscleGroupIcon" />,
  Forearm: <img src={forearmIcon} alt="Forearm" className="muscleGroupIcon" />,
  //   Calisthenic: ( <img src={backWingsIcon} alt="Calisthenic" className="muscleGroupIcon" /> ),
  //   Yoga: <img src={absIcon} alt="Yoga" className="muscleGroupIcon" />,
  Trapezius: (
    <img src={trapeziusIcon} alt="Trapezius" className="muscleGroupIcon" />
  ),
  Neck: <img src={neckIcon} alt="Neck" className="muscleGroupIcon" />,
  Calf: <img src={calfIcon} alt="Calf" className="muscleGroupIcon" />,
  "Back / Wing": (
    <img src={backWingsIcon} alt="Back / Wing" className="muscleGroupIcon" />
  ),
//   "Not specified": (
//     <img src={backWingsIcon} alt="Not specified" className="muscleGroupIcon" />
//   ),
};

export const renderMuscleGroup = (muscle) => {
  return muscleGroupIcons[muscle] ? (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
      }}
      className="muscle-icon"
    >
      {muscleGroupIcons[muscle]}
    </Box>
  ) : null;
};

const MuscleGroupIcons = ({ muscle }) => {
  return renderMuscleGroup(muscle);
};

export default MuscleGroupIcons;