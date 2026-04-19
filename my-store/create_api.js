const fs = require('fs');
const path = require('path');

const dirs = [
    'src/api/flash-sale/content-types/flash-sale',
    'src/api/flash-sale/controllers',
    'src/api/flash-sale/services',
    'src/api/flash-sale/routes'
];

dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created ${dir}`);
    }
});
