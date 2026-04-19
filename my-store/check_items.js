const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

const items = db.prepare('SELECT id, product_name, total FROM order_items LIMIT 5').all();
console.log("Order items:");
console.log(items);

const links = db.prepare('SELECT * FROM order_items_order_lnk').all();
console.log("Order <-> Items Links:");
console.log(links);
