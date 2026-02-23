const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
    const products = db.prepare('SELECT id, name, price_display FROM products LIMIT 5').all();
    console.log('--- Products Sample ---');
    console.log(JSON.stringify(products, null, 2));

    const variants = db.prepare('SELECT id, size, color FROM variants LIMIT 10').all();
    console.log('\n--- Variants Sample ---');
    console.log(JSON.stringify(variants, null, 2));

    // Also get unique sizes and colors for filters
    const allSizes = db.prepare('SELECT DISTINCT size FROM variants WHERE size IS NOT NULL').all();
    const allColors = db.prepare('SELECT DISTINCT color FROM variants WHERE color IS NOT NULL').all();

    console.log('\n--- Unique Sizes ---');
    console.log(allSizes.map(s => s.size));

    console.log('\n--- Unique Colors ---');
    console.log(allColors.map(c => c.color));

} catch (err) {
    console.error(err);
} finally {
    db.close();
}
