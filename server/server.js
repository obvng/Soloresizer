/**
 * SoloResizer Backend Boilerplate
 * 
 * This file serves as a template for the backend when moving to a production environment.
 * Features to implement here:
 * 1. File Upload Processing (Multer)
 * 2. Image Processing (Sharp.js for performance)
 * 3. CRON Jobs for File Cleanup
 * 4. API Endpoints for frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve built React files

// Storage Configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date() });
});

// Example: SEO Dynamic Rendering Endpoint
app.get('*', (req, res) => {
    // In production, serve the index.html
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
    res.send('Frontend Application Placeholder');
});

// Scheduled Task: Cleanup Old Files
// Run every 10 minutes to delete files older than 20 minutes
cron.schedule('*/10 * * * *', () => {
    console.log('Running cleanup task...');
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) return console.error(err);
        
        files.forEach(file => {
            const filePath = path.join(UPLOAD_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                
                const now = new Date().getTime();
                const endTime = new Date(stats.ctime).getTime() + (20 * 60 * 1000); // 20 mins
                
                if (now > endTime) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(err);
                        else console.log(`Deleted expired file: ${file}`);
                    });
                }
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});