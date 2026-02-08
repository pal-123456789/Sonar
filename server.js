import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());       
app.use(express.json());

// --- DYNAMIC STORAGE ---
let sensorHistory = []; 

console.log("🚀 High-Speed Server Started");

// ==================================================================
// 🧹 CLEANUP SYSTEM (The "Self-Cleaning" feature)
// Runs every 2 seconds. Deletes anything older than 10 seconds.
// ==================================================================
setInterval(() => {
    const now = Date.now();
    const beforeCount = sensorHistory.length;

    // Filter: Keep only data that is less than 10,000ms (10s) old
    sensorHistory = sensorHistory.filter(point => (now - point.timestampRaw) < 10000);

    if (sensorHistory.length < beforeCount) {
        // console.log("🧹 Cleaned old data"); // Uncomment to see cleanup logs
    }
}, 2000);

// ==================================================================
// 🔗 ROOT ROUTE (GET /)
// Returns only the "Fresh" data
// ==================================================================
app.get('/', (req, res) => {
    res.json(sensorHistory);
});

// ==================================================================
// 📥 INPUT ROUTE (POST /api/telemetry)
// ==================================================================
app.post('/api/telemetry', (req, res) => {
    const { angle, distance } = req.body;

    if (angle === undefined || distance === undefined) return res.sendStatus(400);

    const newData = {
        id: Date.now(),             // Unique ID based on time
        timestampRaw: Date.now(),    // Used for math (cleanup)
        timestamp: new Date().toISOString(), // Readable time
        angle: angle,
        distance: distance
    };

    sensorHistory.push(newData);
    
    // Log sparingly so terminal isn't flooded
    console.log(`⚡ New Data: ${angle}°, ${distance}cm | Total in buffer: ${sensorHistory.length}`);

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});