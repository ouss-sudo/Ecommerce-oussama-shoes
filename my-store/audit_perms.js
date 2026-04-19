const db = require('better-sqlite3')('.tmp/data.db');

const publicRolePerms = db.prepare(`
    SELECT p.id, p.action 
    FROM up_permissions p
    JOIN up_permissions_role_lnk l ON p.id = l.permission_id
    WHERE l.role_id = 2
`).all();

console.log("Public Role Permissions:");
console.log(JSON.stringify(publicRolePerms, null, 2));
