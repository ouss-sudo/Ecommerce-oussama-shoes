const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:");
console.log(tables.map(t => t.name).filter(n => n.includes('order') || n.includes('user')));
