import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

const db = new Database('.tmp/data.db');

function genDocId() {
  return randomBytes(12).toString('hex').substring(0, 24);
}

const now = Date.now();

// Public role is typically ID 2 in Strapi
const roles = db.prepare(`SELECT id, name FROM up_roles`).all();
console.log('\nAvailable roles:', roles);

const publicRole = roles.find(r => r.name === 'Public');
const authRole = roles.find(r => r.name === 'Authenticated');

if (!publicRole) {
  console.error('❌ Public role not found!');
  db.close();
  process.exit(1);
}

const PERMISSIONS_TO_ADD = [
  { role: publicRole, action: 'api::banner-config.banner-config.find' },
  { role: publicRole, action: 'api::banner-config.banner-config.findOne' },
];

if (authRole) {
  PERMISSIONS_TO_ADD.push(
    { role: authRole, action: 'api::banner-config.banner-config.find' },
    { role: authRole, action: 'api::banner-config.banner-config.findOne' },
  );
}

let added = 0;

for (const { role, action } of PERMISSIONS_TO_ADD) {
  const existing = db.prepare(`
    SELECT p.id FROM up_permissions p
    JOIN up_permissions_role_lnk l ON l.permission_id = p.id
    WHERE l.role_id = ? AND p.action = ?
  `).get(role.id, action);

  if (existing) {
    console.log(`ℹ️  Already exists [${role.name}]:`, action);
    continue;
  }

  const docId = genDocId();
  const result = db.prepare(`
    INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(docId, action, now, now, now);

  const permId = result.lastInsertRowid;
  const maxOrd = db.prepare("SELECT MAX(permission_ord) as m FROM up_permissions_role_lnk WHERE role_id = ?").get(role.id);
  const nextOrd = (maxOrd?.m || 0) + 1;

  db.prepare("INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord) VALUES (?, ?, ?)").run(permId, role.id, nextOrd);
  console.log(`✅ Added [${role.name}]:`, action);
  added++;
}

console.log(`\n✅ Done! Added ${added} banner-config permissions.`);
db.close();
