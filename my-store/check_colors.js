const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
    const products = db.prepare('SELECT id, name, colors FROM products').all();
    console.log('--- Products Colors ---');
    products.forEach(p => {
        console.log(`${p.name}: ${p.colors}`);
    });

} catch (err) {
    console.error(err);
} finally {
    db.close();
}
