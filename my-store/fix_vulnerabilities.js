const db = require('better-sqlite3')('.tmp/data.db');

const dangerousActions = [
    'plugin::users-permissions.user.find',
    'plugin::users-permissions.user.findOne',
    'plugin::users-permissions.user.update',
    'plugin::users-permissions.role.find',
    'plugin::users-permissions.role.findOne'
];

console.log("Starting security patch...");

db.transaction(() => {
    for (const action of dangerousActions) {
        // Find permission IDs for this action
        const perms = db.prepare("SELECT id FROM up_permissions WHERE action = ?").all(action);
        for (const p of perms) {
            // Delete link to Public role (id 2)
            const result = db.prepare("DELETE FROM up_permissions_role_lnk WHERE permission_id = ? AND role_id = 2").run(p.id);
            if (result.changes > 0) {
                console.log(`SECURED: Removed '${action}' from Public role.`);
            }
        }
    }
})();

console.log("Security patch complete. Public Role is now restricted.");
