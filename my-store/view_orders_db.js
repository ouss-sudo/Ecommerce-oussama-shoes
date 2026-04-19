const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();
console.log("Orders:");
console.log(orders);

const users = db.prepare('SELECT id, username, loyalty_points FROM up_users ORDER BY id DESC LIMIT 5').all();
console.log("Users:");
console.log(users);
