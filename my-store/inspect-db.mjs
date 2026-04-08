import Database from 'better-sqlite3';
const db = new Database('.tmp/data.db');

const p = db.prepare("SELECT sql FROM sqlite_master WHERE name='up_permissions'").get();
console.log('up_permissions schema:', p.sql);

const l = db.prepare("SELECT sql FROM sqlite_master WHERE name='up_permissions_role_lnk'").get();
console.log('up_permissions_role_lnk schema:', l.sql);

const sample = db.prepare("SELECT * FROM up_permissions LIMIT 3").all();
console.log('Sample permissions:', JSON.stringify(sample));

const lsample = db.prepare("SELECT * FROM up_permissions_role_lnk LIMIT 3").all();
console.log('Sample link rows:', JSON.stringify(lsample));
