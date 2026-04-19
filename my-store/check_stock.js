const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

const products = db.prepare('SELECT id, document_id, name, stock FROM products LIMIT 3').all();
console.log("Products:");
console.log(products);

const variants = db.prepare('SELECT * FROM components_product_variants').all();
console.log("Variants:");
console.log(variants);
