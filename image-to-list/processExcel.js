const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const axios = require("axios");
const XLSX = require("xlsx");

// Configuration
const SPREADSHEET_PATH = "./FitnessDB.xlsx";
const DOWNLOAD_DIR = "../docs/assets/";
const BATCH_SIZE = 300;

async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const writer = response.data.pipe(fs.createWriteStream(filepath));
      writer.on("finish", () => resolve(filepath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Error downloading ${url}: ${error.message}`);
    return null;
  }
}

async function processSpreadsheet() {
  try {
    // Create downloads directory if it doesn't exist
    await fsPromises.mkdir(DOWNLOAD_DIR, { recursive: true });

    // Read the Excel file
    const workbook = XLSX.readFile(SPREADSHEET_PATH);
    const sheetNames = workbook.SheetNames;

    // Check if the first sheet exists (changed from fourth sheet)
    if (sheetNames.length < 1) {
      console.error("Error: Spreadsheet does not have any sheets.");
      return;
    }

    const sheetName = sheetNames[0]; // First sheet (index 0)
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    let data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    console.log(`Loaded ${data.length} rows from sheet '${sheetName}'`);

    if (data.length === 0) {
      console.log("No data found in the spreadsheet. Exiting.");
      return;
    }

    // Prepare all download tasks
    const downloadTasks = data.map((row) => async () => {
      const imageLink = row.image_link?.trim();

      if (!imageLink) {
        console.log(`No image_link for row: ${JSON.stringify(row)}`);
        return { row, downloadedPath: null };
      }

      const urlParts = imageLink.split("/");
      const originalFilename = urlParts[urlParts.length - 1];
      const safeFilename = `${row.Exercise.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}${path.extname(originalFilename)}`;
      const downloadPath = path.join(DOWNLOAD_DIR, safeFilename);

      // Skip if already downloaded and file exists
      if (
        row.related_path &&
        (await fsPromises
          .access(row.related_path)
          .then(() => true)
          .catch(() => false))
      ) {
        console.log(
          `Skipping ${row.Exercise} - already downloaded to ${row.related_path}`
        );
        return { row, downloadedPath: row.related_path };
      }

      console.log(`Queueing download for ${row.Exercise} from ${imageLink}`);
      const downloadedPath = await downloadImage(imageLink, downloadPath);

      return { row, safeFilename }; // Return full path, not just filename
    });

    // Process downloads in batches of 500
    const allResults = [];
    for (let i = 0; i < downloadTasks.length; i += BATCH_SIZE) {
      const batch = downloadTasks.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)`
      );
      const batchPromises = batch.map((task) => task());
      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
      console.log(`Completed batch ${i / BATCH_SIZE + 1}`);
    }

    console.log(`Completed ${allResults.length} download operations`);

    // Update data with relative paths
    const updatedData = allResults.map(({ row, safeFilename }) => {
      if (safeFilename) {
        row.related_path = path.relative(
          path.dirname(SPREADSHEET_PATH),
          safeFilename
        );
        console.log(`Saved ${row.Exercise} to: ${safeFilename}`);
      }
      return row;
    });

    // Skip further processing if no data to update
    if (updatedData.length === 0) {
      console.log("No data to write back to spreadsheet.");
      return;
    }

    // Ensure "related_path" column exists
    if (!updatedData[0].hasOwnProperty("related_path")) {
      console.log("Adding 'related_path' column to all rows");
      updatedData.forEach((row) => {
        if (!row.related_path) row.related_path = "";
      });
    }

    // Create new worksheet with updated data
    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
    const headers = Object.keys(updatedData[0]);
    newWorksheet["!cols"] = headers.map(() => ({ wch: 20 }));

    // Create new workbook and append the updated worksheet
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

    // Write updated spreadsheet once
    XLSX.writeFile(newWorkbook, SPREADSHEET_PATH);

    console.log("Spreadsheet processing complete!");
  } catch (error) {
    console.error("Error processing spreadsheet:", error);
  }
}

// Run the application
processSpreadsheet();
