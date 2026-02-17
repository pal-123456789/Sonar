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



// server.js - The Brain of the Operation
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// STORE THE LIVE SPECTRUM
// We don't need a history for this demo, just the "Right Now" status.
let machineStatus = {
    spectrum: [],      // The array of frequencies (e.g., [0, 5, 20, 100, ...])
    peakFreq: 0,       // The loudest frequency (Hz)
    peakAmp: 0,        // How loud it is (Magnitude)
    health: "UNKNOWN", // HEALTHY, WARNING, or CRITICAL
    timestamp: 0
};

console.log("🚀 Spectral Guard System Started");

// 1. DASHBOARD ASKS: "How is the machine?"
app.get('/api/status', (req, res) => {
    res.json(machineStatus);
});

// 2. ESP32 SAYS: "Here is the latest vibration analysis"
app.post('/api/telemetry', (req, res) => {
    const { spectrum, peakFreq, peakAmp } = req.body;

    if (!spectrum) return res.sendStatus(400);

    // --- AI LOGIC (Simple Expert System) ---
    // You tune these numbers based on the specific machine you are testing.
    let health = "HEALTHY";
    
    if (peakAmp > 2000) { // If vibration is strong...
        if (peakFreq < 20) health = "LOOSE MOUNTING"; // Low Freq Wobble
        else if (peakFreq > 100) health = "BEARING FAULT"; // High Freq Rattle
        else health = "UNBALANCED LOAD"; // Mid Freq Shake
    }

    // Update State
    machineStatus = {
        spectrum: spectrum,
        peakFreq: peakFreq,
        peakAmp: peakAmp,
        health: health,
        timestamp: new Date().toLocaleTimeString()
    };

    console.log(`📡 Update: Peak ${peakFreq}Hz @ ${peakAmp} Mag -> ${health}`);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server Live on port ${PORT}`);
});