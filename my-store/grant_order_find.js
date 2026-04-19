const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

// Find authenticated role ID
const authRole = db.prepare("SELECT id FROM up_roles WHERE type = 'authenticated'").get();
if (authRole) {
  const insertStmt = db.prepare(`
    INSERT INTO up_permissions (action, role_id, created_at, updated_at) 
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  
  try {
     insertStmt.run('api::order.order.find', authRole.id);
     console.log("Permission granted.");
  } catch(e) {
     if (e.message.includes('UNIQUE constraint failed')) {
         console.log("Permission already exists.");
     } else {
         console.error(e);
     }
  }
}
