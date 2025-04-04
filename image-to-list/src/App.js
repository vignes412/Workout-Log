// App.jsx
import React, { useState } from "react";
import Tesseract from "tesseract.js";

function App() {
  const [image, setImage] = useState(null);
  const [textList, setTextList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("eng"); // Default to English

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    convertImageToText(file);
  };

  const convertImageToText = (file) => {
    setLoading(true);
    Tesseract.recognize(
      file,
      language, // Use selected language
      { logger: (m) => console.log(m) }
    )
      .then(({ data: { text } }) => {
        // Split text into array by lines and filter empty lines
        const textArray = text.split("\n").filter((item) => item.trim() !== "");
        setTextList(textArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="App" style={{ padding: "20px" }}>
      <h1>Image to List Converter</h1>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="language">Select Language: </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="eng">English</option>
          <option value="tam">Tamil</option>
          <option value="eng+tam">English + Tamil</option>
        </select>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: "20px" }}
      />

      {image && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Uploaded Image:</h2>
          <img src={image} alt="Uploaded" style={{ maxWidth: "300px" }} />
        </div>
      )}

      {loading && <p>Processing image...</p>}

      {textList.length > 0 && (
        <div>
          <h2>
            Extracted Text List (
            {language === "eng"
              ? "English"
              : language === "tam"
              ? "Tamil"
              : "English+Tamil"}
            ):
          </h2>
          <ul
            style={{ textAlign: "left", maxWidth: "600px", margin: "0 auto" }}
          >
            {textList.map((item, index) => (
              <li key={index} style={{ margin: "5px 0" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
