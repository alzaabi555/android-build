
const fs = require('fs');
const path = require('path');

const dest = 'www';

// Ensure destination exists
if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
}

// Files to copy from root to www
const filesToCopy = [
    'index.html',
    'manifest.json',
    'icon.png',
    'noor_logo.png',
    'oman_logo.png'
];

console.log('Starting asset copy...');

filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fs.copyFileSync(file, path.join(dest, file));
            console.log(`Copied ${file} to ${dest}`);
        } catch (err) {
            console.error(`Error copying ${file}:`, err);
        }
    } else {
        console.warn(`Warning: ${file} not found, skipping.`);
    }
});

// Copy PDF Worker
const pdfWorkerSrc = path.join('node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const pdfWorkerDest = path.join(dest, 'pdf.worker.js');

if (fs.existsSync(pdfWorkerSrc)) {
    try {
        fs.copyFileSync(pdfWorkerSrc, pdfWorkerDest);
        console.log(`Copied pdf.worker.min.js to ${pdfWorkerDest}`);
    } catch (err) {
        console.error('Error copying PDF worker:', err);
    }
} else {
    console.warn('Warning: PDF worker file not found in node_modules.');
}

console.log('Asset copy complete.');
