const fetch = require("node-fetch").default;
const fs = require("fs").promises;
const path = require("path");

async function downloadAndCacheFile() {
  const url =
    "https://fitnessprogramer.com/wp-content/uploads/2022/02/Lying-Weighted-Lateral-Neck-Flexion.gif";
  const cacheDir = path.join(__dirname, "cache");
  const cacheFile = path.join(
    cacheDir,
    "Lying-Weighted-Lateral-Neck-Flexion.gif"
  );

  try {
    console.log("Checking cache...");

    // Check if cache directory exists, create if not
    try {
      await fs.access(cacheDir);
    } catch {
      await fs.mkdir(cacheDir);
    }

    // Check if file exists in cache
    try {
      await fs.access(cacheFile);
      console.log("File found in cache");
      return;
    } catch {
      // File not in cache, proceed to download
    }

    console.log("Downloading file...");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/gif",
        Referer:
          "https://fitnessprogramer.com/exercise/lying-weighted-lateral-neck-flexion/",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.buffer();
    await fs.writeFile(cacheFile, buffer);
    console.log("File downloaded and cached successfully at:", cacheFile);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

downloadAndCacheFile();
