const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

const links = db.prepare('SELECT * FROM orders_user_lnk').all();
console.log("Order-User Links:");
console.log(links);
