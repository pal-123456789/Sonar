import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());       
app.use(express.json());

// --- DATA STORAGE ---
// This list will hold all your sensor data in memory.
// Note: On Render's Free Tier, this list resets if the server restarts.
const sensorHistory = []; 

console.log("🚀 History API Server Started");

// ==================================================================
// 🔗 ROOT ROUTE (GET /)
// This is what you asked for. 
// Go to "https://your-app.onrender.com" to see ALL data.
// ==================================================================
app.get('/', (req, res) => {
    // Return the entire list as JSON
    res.json(sensorHistory);
});

// ==================================================================
// 📥 INPUT ROUTE (POST /api/telemetry)
// The ESP32 sends data here to be saved.
// ==================================================================
app.post('/api/telemetry', (req, res) => {
    const { angle, distance } = req.body;

    // 1. Validate Data
    if (angle === undefined || distance === undefined) {
        return res.status(400).send("Missing Data");
    }

    // 2. Create the data packet
    const newData = {
        id: sensorHistory.length + 1, // clear ID like 1, 2, 3...
        timestamp: new Date().toISOString(),
        angle: angle,
        distance: distance
    };

    // 3. Add to the history list
    sensorHistory.push(newData);

    // (Optional) Limit to last 5000 points to save memory
    if (sensorHistory.length > 5000) {
        sensorHistory.shift(); 
    }

    console.log(`✅ Saved Data Point #${newData.id}: ${angle}°, ${distance}cm`);
    
    // Send success back to ESP32
    res.sendStatus(200);
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
