const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5501;
const { exec } = require('child_process');

// Serve static files (frontend)
app.use(express.static(__dirname));

// Endpoint to list TTL files
app.get('/list-ttl-files', (req, res) => {
    const dirPath = path.join(__dirname, 'ttl_files');
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read directory' });
        }
        const ttlFiles = files
            .filter(f => f.endsWith('.ttl'))
            .map(f => f.replace(/\.ttl$/, ''));
        res.json(ttlFiles);
    });
});

// Endpoint to generate ttl_files.json
app.post('/generate-ttl-list', (req, res) => {
    exec('node generate-ttl-list.js', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing generate-ttl-list.js:', error);
            return res.status(500).json({ error: 'Failed to generate ttl_files.json', details: stderr });
        }
        res.json({ success: true, message: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 