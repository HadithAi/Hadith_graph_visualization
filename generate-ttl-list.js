const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'ttl_files');
const outputPath = path.join(__dirname, 'ttl_files.json');

try {
    const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.ttl'))
        .map(f => f.replace(/\.ttl$/, ''));
    fs.writeFileSync(outputPath, JSON.stringify(files, null, 2));
    console.log(`Successfully wrote ${files.length} entries to ttl_files.json`);
} catch (err) {
    console.error('Error generating ttl_files.json:', err);
    process.exit(1);
} 