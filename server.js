const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files (frontend)
app.use(express.static(__dirname));

// Endpoint to list TTL files
app.get('/ttl_files', (req, res) => {
    const dirPath = path.join(__dirname, '');
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 