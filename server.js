import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup for file paths (Required for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 2. Define the path to your database.csv
const csvFilePath = path.join(__dirname, 'database.csv');

// 3. Ensure the file has headers (if it's empty or missing)
if (!fs.existsSync(csvFilePath)) {
    fs.writeFileSync(csvFilePath, 'Timestamp,Angle,Distance\n');
    console.log("📄 Created new database.csv with headers");
}

console.log("🚀 Server Started");

// ==================================================================
// ROUTE 1: VIEW/DOWNLOAD THE DATABASE
// Go to: https://your-app-name.onrender.com/database.csv
// ==================================================================
app.get('/database.csv', (req, res) => {
    res.download(csvFilePath, 'database.csv', (err) => {
        if (err) {
            res.status(500).send("Error downloading file.");
        }
    });
});

// ==================================================================
// ROUTE 2: RECEIVE DATA FROM ESP32 AND AUTO-SAVE
// ==================================================================
app.post('/api/telemetry', (req, res) => {
    const { angle, distance } = req.body;

    // Validation: Ensure data is not empty
    if (angle === undefined || distance === undefined) {
        return res.status(400).send("Missing data");
    }

    // Prepare the CSV row
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp},${angle},${distance}\n`;

    // AUTOMATICALLY APPEND TO FILE
    fs.appendFile(csvFilePath, logEntry, (err) => {
        if (err) {
            console.error("❌ Error writing to file:", err);
            return res.status(500).send("Write Error");
        }
        console.log(`💾 Auto-Saved: ${angle}°, ${distance}cm`);
    });

    res.sendStatus(200);
});

// Default Home Route
app.get('/', (req, res) => {
    res.send("✅ Server Running. Go to <b>/database.csv</b> to download your data.");
});

// Start the Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});