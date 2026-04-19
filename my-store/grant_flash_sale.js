const db = require('better-sqlite3')('.tmp/data.db');

console.log("Adding Public permission for Flash Sale...");

try {
    // 1. Create the permission record if it doesn't exist
    const action = 'api::flash-sale.flash-sale.find';
    
    // Check if permission already exists
    let perm = db.prepare("SELECT id FROM up_permissions WHERE action = ?").get(action);
    if (!perm) {
        const result = db.prepare(`
            INSERT INTO up_permissions (action, created_at, updated_at) 
            VALUES (?, ?, ?)
        `).run(action, Date.now(), Date.now());
        perm = { id: result.lastInsertRowid };
        console.log(`Created permission record for ${action}`);
    } else {
        console.log(`Permission record for ${action} already exists (ID: ${perm.id})`);
    }

    // 2. Link it to Public role (id 2)
    const exists = db.prepare("SELECT * FROM up_permissions_role_lnk WHERE permission_id = ? AND role_id = 2").get(perm.id);
    if (!exists) {
        db.prepare("INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES (?, ?)").run(perm.id, 2);
        console.log("LINKED: Public role can now access Flash Sale API.");
    } else {
        console.log("ALREADY LINKED: Public role already has access.");
    }

} catch (err) {
    console.error("Error setting permission:", err);
}

console.log("Finished.");
