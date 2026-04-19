const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('c:', 'Users', 'Oussema', 'Desktop', 'strapi', 'my-store', '.tmp', 'data.db');
const db = new Database(dbPath, { readonly: true });

console.log('--- TABLES ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(', '));

console.log('\n--- DERNIERS UTILISATEURS ---');
try {
    const users = db.prepare("SELECT id, username, email, firstName, lastName FROM up_users ORDER BY id DESC LIMIT 5").all();
    console.table(users);
} catch (e) {
    console.log('Erreur up_users:', e.message);
}

db.close();
