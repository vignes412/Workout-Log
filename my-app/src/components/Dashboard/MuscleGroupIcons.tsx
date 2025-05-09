import React, { ReactElement } from "react";
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

interface MuscleGroupIcons {
  [key: string]: React.ReactNode;
}

export const muscleGroupIcons: MuscleGroupIcons = {
  Abs: <img src={absIcon} alt="Abs" className="muscleGroupIcon" />,
  Hip: <img src={HipIcon} alt="Hip" className="muscleGroupIcon" />,
  Triceps: <img src={TricepsIcon} alt="Triceps" className="muscleGroupIcon" />,
  Chest: <img src={ChestIcon} alt="Chest" className="muscleGroupIcon" />,
  Leg: <img src={LegIcon} alt="Leg" className="muscleGroupIcon" />,
  Shoulders: <img src={shouldeIcon} alt="Shoulders" className="muscleGroupIcon" />,
  Biceps: <img src={bicepsIcon} alt="Biceps" className="muscleGroupIcon" />,
  Forearm: <img src={forearmIcon} alt="Forearm" className="muscleGroupIcon" />,
  Trapezius: <img src={trapeziusIcon} alt="Trapezius" className="muscleGroupIcon" />,
  Neck: <img src={neckIcon} alt="Neck" className="muscleGroupIcon" />,
  Calf: <img src={calfIcon} alt="Calf" className="muscleGroupIcon" />,
  "Back / Wing": <img src={backWingsIcon} alt="Back / Wing" className="muscleGroupIcon" />,
};

export const renderMuscleGroup = (muscle: string): React.ReactNode | null => {
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

interface MuscleGroupIconsProps {
  muscle: string;
}

const MuscleGroupIcons = ({ muscle }: MuscleGroupIconsProps): React.ReactNode => {
  return renderMuscleGroup(muscle);
};

export default MuscleGroupIcons;