// src/pages/BodyweightModal.js
import React, { useState } from "react";
import { appendData, cacheData, loadCachedData } from "../utils/sheetsApi";

const BodyweightModal = ({ closeModal, isOffline }) => {
  const [weight, setWeight] = useState({ date: "", weight: "" });
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    if (!weight.date || !weight.weight) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (isOffline) {
      setMessage({ type: "error", text: "Cannot log bodyweight offline" });
      return;
    }
    try {
      const row = [weight.date, weight.weight];
      await appendData("Bodyweight!A:B", row);
      await cacheData("/api/bodyweight", [
        ...((await loadCachedData("/api/bodyweight")) || []),
        { date: weight.date, weight: weight.weight },
      ]);
      setMessage({ type: "success", text: "Bodyweight logged" });
      setTimeout(closeModal, 1000);
    } catch (error) {
      setMessage({ type: "error", text: "Error logging bodyweight" });
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeModal}></div>
      <div className="modal">
        <h2>Add Bodyweight</h2>
        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
        <input
          type="date"
          value={weight.date}
          onChange={(e) => setWeight({ ...weight, date: e.target.value })}
        />
        <input
          type="number"
          placeholder="Weight (lbs)"
          value={weight.weight}
          onChange={(e) => setWeight({ ...weight, weight: e.target.value })}
        />
        <button onClick={handleSubmit} disabled={isOffline}>
          Submit
        </button>
        <button onClick={closeModal}>Close</button>
      </div>
    </>
  );
};

export default BodyweightModal;
