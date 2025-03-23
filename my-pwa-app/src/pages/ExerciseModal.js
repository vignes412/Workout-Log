// src/pages/ExerciseModal.js
import React, { useState } from "react";
import { appendData, cacheData, loadCachedData } from "../utils/sheetsApi";

const ExerciseModal = ({ closeModal, isOffline }) => {
  const [exercise, setExercise] = useState({ muscleGroup: "", exercise: "" });
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    if (!exercise.muscleGroup || !exercise.exercise) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot add exercise offline" });
      return;
    }
    try {
      const row = [exercise.muscleGroup, exercise.exercise];
      await appendData("Exercises!A:B", row);
      await cacheData("/api/exercises", [
        ...((await loadCachedData("/api/exercises")) || []),
        { muscleGroup: exercise.muscleGroup, exercise: exercise.exercise },
      ]);
      setMessage({ type: "success", text: "Exercise added" });
      setTimeout(closeModal, 1000);
    } catch (error) {
      setMessage({ type: "error", text: "Error adding exercise" });
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeModal}></div>
      <div className="modal">
        <h2>Add Exercise</h2>
        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
        <input
          placeholder="Muscle Group"
          value={exercise.muscleGroup}
          onChange={(e) =>
            setExercise({ ...exercise, muscleGroup: e.target.value })
          }
        />
        <input
          placeholder="Exercise"
          value={exercise.exercise}
          onChange={(e) =>
            setExercise({ ...exercise, exercise: e.target.value })
          }
        />
        <button onClick={handleSubmit} disabled={isOffline}>
          Submit
        </button>
        <button onClick={closeModal}>Close</button>
      </div>
    </>
  );
};

export default ExerciseModal;
