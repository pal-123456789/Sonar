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

// STORE THE LIVE STATUS (Now includes Temp & Amps)
let machineStatus = {
    spectrum: [],      
    peakFreq: 0,       
    peakAmp: 0,
    temp: 25.0,
    amps: 0.0,
    health: "UNKNOWN", 
    timestamp: 0
};

console.log("🚀 Spectral Guard System Started");

app.get('/api/status', (req, res) => {
    res.json(machineStatus);
});

app.post('/api/telemetry', (req, res) => {
    // Extract the new variables from the ESP32
    const { spectrum, peakFreq, peakAmp, temp, amps } = req.body;

    if (!spectrum) return res.sendStatus(400);

    // --- CLOUD AI LOGIC ---
    let health = "HEALTHY";
    
    if (temp > 85.0) {
        health = "CRITICAL OVERHEAT";
    } else if (amps > 6.5) {
        health = "POWER SURGE";
    } else if (peakAmp > 20000) { 
        health = "SEVERE VIBRATION"; 
    } else if (peakAmp > 10000) {
        health = "WARNING: UNBALANCED";
    }

    // Update State
    machineStatus = {
        spectrum: spectrum,
        peakFreq: peakFreq,
        peakAmp: peakAmp,
        temp: temp,
        amps: amps,
        health: health,
        timestamp: new Date().toLocaleTimeString()
    };

    console.log(`📡 Update: ${peakFreq}Hz | Temp: ${temp}C | Amps: ${amps}A -> ${health}`);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server Live on port ${PORT}`);
});