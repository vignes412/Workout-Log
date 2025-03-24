const fs = require("fs-extra");
const path = require("path");

// Define paths for the build folder and docs folder
const buildDir = path.join(__dirname, "build");
const docsDir = path.join(__dirname, "..", "docs");

// Function to move files
async function moveFiles() {
  try {
    await fs.copy(buildDir, docsDir); // Copies all files from build to docs
    await fs.remove(buildDir); // Optionally, remove the build folder after moving
    console.log("Files moved successfully!");
  } catch (err) {
    console.error("Error moving files:", err);
  }
}

moveFiles();
