const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

// Add 196 points to oussama@gmail.com
db.prepare('UPDATE up_users SET loyalty_points = loyalty_points + ? WHERE email = ?').run(196, 'oussama@gmail.com');

// Get new points
const user = db.prepare('SELECT username, loyalty_points FROM up_users WHERE email = ?').get('oussama@gmail.com');
console.log(user);
