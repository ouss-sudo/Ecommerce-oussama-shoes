/**
 * Direct SQLite fix for Strapi permissions
 * Grants upload + user permissions to Authenticated role
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(dbPath);

try {
  // Show tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));

  // Find authenticated role
  const roles = db.prepare("SELECT * FROM up_roles").all();
  console.log('\nRoles:', roles.map(r => `id=${r.id} type=${r.type} name=${r.name}`));

  const authRole = roles.find(r => r.type === 'authenticated');
  if (!authRole) { console.error('No authenticated role found'); process.exit(1); }
  console.log('\nAuthenticated role ID:', authRole.id);

  // Show current permissions
  const perms = db.prepare("SELECT * FROM up_permissions WHERE role_link_id = ? ORDER BY action").all(authRole.id);
  console.log('\nCurrent permissions for Authenticated role:');
  perms.forEach(p => console.log(' -', p.action));

  // Check the permission table structure
  const permSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name='up_permissions'").get();
  console.log('\nPermission table schema:', permSchema?.sql?.substring(0, 300));

  // Permissions we need to add
  const needed = [
    'plugin::upload.content-api.upload',
    'plugin::users-permissions.user.find',
    'plugin::users-permissions.user.findone',
    'plugin::users-permissions.user.update',
    'plugin::users-permissions.user.me',
  ];

  const now = new Date().toISOString();
  let added = 0;

  for (const action of needed) {
    const exists = db.prepare("SELECT id FROM up_permissions WHERE role_link_id = ? AND action = ?").get(authRole.id, action);
    if (!exists) {
      try {
        db.prepare("INSERT INTO up_permissions (action, role_link_id, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?)").run(action, authRole.id, now, now, now);
        console.log('✅ Added:', action);
        added++;
      } catch (e) {
        // Try without published_at
        try {
          db.prepare("INSERT INTO up_permissions (action, role_link_id, created_at, updated_at) VALUES (?, ?, ?, ?)").run(action, authRole.id, now, now);
          console.log('✅ Added (v2):', action);
          added++;
        } catch (e2) {
          console.log('❌ Failed to add', action, ':', e2.message);
        }
      }
    } else {
      console.log('ℹ️  Already exists:', action);
    }
  }

  console.log(`\nDone! Added ${added} new permissions.`);
  db.close();
} catch (err) {
  console.error('Error:', err.message);
  db.close();
}
