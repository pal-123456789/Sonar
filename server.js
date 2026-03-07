// import express from 'express';
// import cors from 'cors';

// const app = express();
// app.use(cors());       
// app.use(express.json());

// // ==================================================================
// // ⚙️ CONFIGURATION
// // ==================================================================
// const RETENTION_MINUTES = 5; // Keep data for 5 minutes
// const RETENTION_MS = RETENTION_MINUTES * 60 * 1000; 

// // --- DYNAMIC STORAGE ---
// let sensorHistory = []; 

// console.log(`🚀 Server Started. Keeping data for ${RETENTION_MINUTES} minutes.`);

// // ==================================================================
// // 🧹 CLEANUP SYSTEM (Runs every 10 seconds)
// // Deletes data older than 5 minutes to keep memory fresh.
// // ==================================================================
// setInterval(() => {
//     const now = Date.now();
//     const beforeCount = sensorHistory.length;

//     // Filter: Keep only data newer than the retention period
//     sensorHistory = sensorHistory.filter(point => (now - point.timestampRaw) < RETENTION_MS);

//     // Optional: Safety Cap (Prevent crashing if data gets too huge)
//     if (sensorHistory.length > 10000) {
//         sensorHistory = sensorHistory.slice(-10000); // Keep only last 10,000 points
//     }

//     if (sensorHistory.length < beforeCount) {
//          console.log(`🧹 Cleanup: Removed ${beforeCount - sensorHistory.length} old points.`);
//     }
// }, 10000); // Check for cleanup every 10 seconds

// // ==================================================================
// // 🔗 ROOT ROUTE (GET /)
// // Returns the 5-minute history buffer
// // ==================================================================
// app.get('/', (req, res) => {
//     res.json(sensorHistory);
// });

// // ==================================================================
// // 📥 INPUT ROUTE (POST /api/telemetry)
// // ==================================================================
// app.post('/api/telemetry', (req, res) => {
//     const { angle, distance } = req.body;

//     if (angle === undefined || distance === undefined) return res.sendStatus(400);

//     const newData = {
//         id: Date.now(),             
//         timestampRaw: Date.now(),    
//         timestamp: new Date().toISOString(), 
//         angle: angle,
//         distance: distance
//     };

//     sensorHistory.push(newData);
    
//     // Log every 10th point to keep terminal clean
//     if (sensorHistory.length % 10 === 0) {
//         console.log(`⚡ Buffer Size: ${sensorHistory.length} points | Latest: ${angle}°, ${distance}cm`);
//     }

//     res.sendStatus(200);
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//     console.log(`✅ Server running on port ${PORT}`);
// });

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const MAX_HISTORY_POINTS = 50; 
const DATA_EXPIRY_MS = 5 * 60 * 1000; 

// Initial state now includes 6-Axis Data
let machineStatus = {
    spectrum: [],      
    peakFreq: 0,       
    peakAmp: 0,
    temp: 25.0,
    amps: 0.0,
    accelX: 0,
    accelY: 0,
    accelZ: 0,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    status: "OFFLINE", 
    timestamp: Date.now()
};

let history = [];

console.log("🚀 6-Axis Spectral Guard System Started");

app.get('/api/telemetry', (req, res) => {
    const now = Date.now();
    history = history.filter(point => (now - point.rawTime) < DATA_EXPIRY_MS);

    res.json({
        current: machineStatus,
        history: history,
        serverTime: now
    });
});

app.post('/api/telemetry', (req, res) => {
    // Extract the new 6-axis data from the ESP32
    const { spectrum, peakFreq, peakAmp, temp, amps, accelX, accelY, accelZ, gyroX, gyroY, gyroZ } = req.body;

    if (spectrum === undefined) return res.sendStatus(400);

    let currentStatus = "HEALTHY";
    if (temp > 85.0) currentStatus = "CRITICAL OVERHEAT";
    else if (amps > 6.5) currentStatus = "POWER SURGE";
    else if (peakAmp > 30000) currentStatus = "SEVERE VIBRATION";
    else if (gyroX > 5000 || gyroY > 5000 || gyroZ > 5000) currentStatus = "WARNING: SHAFT TWIST";
    else if (peakAmp > 15000) currentStatus = "WARNING: UNBALANCED";

    const now = Date.now();

    // Update Live State with 6-Axis Data
    machineStatus = {
        spectrum,
        peakFreq,
        peakAmp,
        temp,
        amps,
        accelX,
        accelY,
        accelZ,
        gyroX,
        gyroY,
        gyroZ,
        status: currentStatus,
        timestamp: now
    };

    history.push({
        temp: temp,
        amps: amps,
        time: new Date().toLocaleTimeString(),
        rawTime: now 
    });

    if (history.length > MAX_HISTORY_POINTS) {
        history.shift(); 
    }

    console.log(`📡 [${new Date().toLocaleTimeString()}] ${currentStatus} | T:${temp}C | A:${amps}A | 3D_Vib:${Math.round(peakAmp)}`);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server Live on port ${PORT}`);
});