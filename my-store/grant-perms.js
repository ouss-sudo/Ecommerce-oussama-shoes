const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
  const role = db.prepare("SELECT id FROM up_roles WHERE type = 'authenticated'").get();
  if (role) {
    const roleId = role.id;
    const actions = [
      'plugin::users-permissions.user.find',
      'plugin::users-permissions.user.findOne',
      'plugin::users-permissions.user.update',
      'plugin::upload.content-api.upload'
    ];

    for (const action of actions) {
      const exists = db.prepare("SELECT id FROM up_permissions WHERE role_link_id = ? AND action = ?").get(roleId, action);
      if (!exists) {
         console.log('Adding', action);
         // Strapi v4/v5 handles up_permissions differently. Actually, let's insert into up_permissions. 
         // Wait, the column names changed in v4/v5. It's usually `action` and `role_link_id` or similar? Let's check table schema.
      }
    }
  }
} catch(e) {
  console.error(e);
}
