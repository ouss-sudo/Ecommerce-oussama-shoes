const db = require('better-sqlite3')('.tmp/data.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'up_%'").all();
console.log(JSON.stringify(tables, null, 2));
