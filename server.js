import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());       // Allow anyone to fetch this data
app.use(express.json());

// 1. Initialize the JSON file if it doesn't exist
const DATA_FILE = 'data.json';
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ angle: 0, distance: 0 }));
}

console.log("🚀 API Server Started");

// ==================================================================
// 🔗 THE LINK YOU WANT: GET /data.json
// This gives you the raw data: {"angle": 45, "distance": 12}
// ==================================================================
app.get('/data.json', (req, res) => {
    // Read the file and send it to whoever asks
    const data = fs.readFileSync(DATA_FILE);
    const jsonData = JSON.parse(data);
    res.json(jsonData);
});

// ==================================================================
// 📥 INPUT: ESP32 sends data here
// ==================================================================
app.post('/api/telemetry', (req, res) => {
    const { angle, distance } = req.body;

    // 1. Create the new data object
    const newData = {
        angle: angle,
        distance: distance,
        lastUpdated: new Date().toISOString() // Optional: adds a timestamp
    };

    // 2. Overwrite the data.json file with new data
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));

    console.log(`Updated JSON: ${angle}°, ${distance}cm`);
    res.sendStatus(200);
});

// Default Route
app.get('/', (req, res) => {
    res.send("✅ Server Live. Get your data at: <b>/data.json</b>");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ JSON API running on port ${PORT}`);
});