import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

const db = new Database('.tmp/data.db');

function genDocId() {
  return randomBytes(12).toString('hex').substring(0, 24);
}

const now = Date.now();

// Authenticated role ID is 1
const ROLE_ID = 1;

const needed = [
  'plugin::upload.content-api.upload',
  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findone',
  'plugin::users-permissions.user.update',
  'plugin::users-permissions.user.me',
];

// Show existing permissions for this role
const existingPerms = db.prepare(`
  SELECT p.action FROM up_permissions p
  JOIN up_permissions_role_lnk l ON l.permission_id = p.id
  WHERE l.role_id = ?
  ORDER BY p.action
`).all(ROLE_ID);

console.log(`\nRole ${ROLE_ID} currently has ${existingPerms.length} permissions:`);
existingPerms.forEach(p => console.log(' -', p.action));

let added = 0;

for (const action of needed) {
  // Check if permission exists and is linked to this role
  const existing = db.prepare(`
    SELECT p.id FROM up_permissions p
    JOIN up_permissions_role_lnk l ON l.permission_id = p.id
    WHERE l.role_id = ? AND p.action = ?
  `).get(ROLE_ID, action);

  if (existing) {
    console.log('ℹ️  Already exists:', action);
    continue;
  }

  // Create the permission
  const docId = genDocId();
  const insertPerm = db.prepare(`
    INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insertPerm.run(docId, action, now, now, now);
  const permId = result.lastInsertRowid;

  // Link it to the authenticated role
  const maxOrd = db.prepare("SELECT MAX(permission_ord) as m FROM up_permissions_role_lnk WHERE role_id = ?").get(ROLE_ID);
  const nextOrd = (maxOrd?.m || 0) + 1;
  
  db.prepare("INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord) VALUES (?, ?, ?)").run(permId, ROLE_ID, nextOrd);
  
  console.log('✅ Added:', action);
  added++;
}

console.log(`\n✅ Done! Added ${added} permissions to Authenticated role.`);
db.close();
