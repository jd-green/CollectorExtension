const fs = require('fs');
const path = require('path');

// Simple icon data - a blue square with "MD" text
const iconData = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#4285F4" rx="16" ry="16"/>
  <text x="64" y="80" font-family="Arial" font-size="48" font-weight="bold" text-anchor="middle" fill="white">MD</text>
</svg>
`;

// Function to convert SVG to PNG using browser APIs
// For simplicity, we'll just save the SVG files directly
// In a real project, you'd want to convert these to PNG

function saveIcon(size) {
  const svgData = iconData.replace('width="128"', `width="${size}"`).replace('height="128"', `height="${size}"`);
  fs.writeFileSync(path.join(__dirname, `default_icon${size}.svg`), svgData);
  console.log(`Created icon: default_icon${size}.svg`);
}

// Create icons in different sizes
saveIcon(16);
saveIcon(48);
saveIcon(128);

console.log('Default icons created. Note: These are SVG files. For production, convert to PNG.');
console.log('For now, rename the files to .png for the extension to use them.'); 