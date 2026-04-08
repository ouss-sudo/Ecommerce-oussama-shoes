import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

const db = new Database('.tmp/data.db');

function genDocId() {
  return randomBytes(12).toString('hex').substring(0, 24);
}

const now = Date.now();
const PUBLIC_ROLE_ID = 2; // Public role

// Check what permissions exist for user-upload
const existing = db.prepare(`
  SELECT p.action, p.id FROM up_permissions p
  JOIN up_permissions_role_lnk l ON l.permission_id = p.id
  WHERE p.action LIKE '%user-upload%'
`).all();

console.log('Existing user-upload permissions:', existing);

// Add the permission to PUBLIC role so anyone with a valid token can upload
const action = 'api::user-upload.user-upload.upload';

const alreadyLinked = db.prepare(`
  SELECT p.id FROM up_permissions p
  JOIN up_permissions_role_lnk l ON l.permission_id = p.id
  WHERE l.role_id = ? AND p.action = ?
`).get(PUBLIC_ROLE_ID, action);

if (alreadyLinked) {
  console.log('✅ Permission already exists for public role');
} else {
  // Insert permission
  const docId = genDocId();
  const res = db.prepare(`
    INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(docId, action, now, now, now);
  const permId = res.lastInsertRowid;
  
  const maxOrd = db.prepare("SELECT MAX(permission_ord) as m FROM up_permissions_role_lnk WHERE role_id = ?").get(PUBLIC_ROLE_ID);
  const nextOrd = (maxOrd?.m || 0) + 1;
  db.prepare("INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord) VALUES (?, ?, ?)").run(permId, PUBLIC_ROLE_ID, nextOrd);
  
  console.log('✅ Added user-upload permission to Public role');
}

// Also add to authenticated role
const AUTH_ROLE_ID = 1;
const alreadyLinkedAuth = db.prepare(`
  SELECT p.id FROM up_permissions p
  JOIN up_permissions_role_lnk l ON l.permission_id = p.id
  WHERE l.role_id = ? AND p.action = ?
`).get(AUTH_ROLE_ID, action);

if (alreadyLinkedAuth) {
  console.log('✅ Permission already exists for authenticated role');
} else {
  const docId2 = genDocId();
  const res2 = db.prepare(`
    INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(docId2, action, now, now, now);
  const permId2 = res2.lastInsertRowid;
  
  const maxOrd2 = db.prepare("SELECT MAX(permission_ord) as m FROM up_permissions_role_lnk WHERE role_id = ?").get(AUTH_ROLE_ID);
  const nextOrd2 = (maxOrd2?.m || 0) + 1;
  db.prepare("INSERT INTO up_permissions_role_lnk (permission_id, role_id, permission_ord) VALUES (?, ?, ?)").run(permId2, AUTH_ROLE_ID, nextOrd2);
  
  console.log('✅ Added user-upload permission to Authenticated role');
}

db.close();
console.log('\nDone! Restart Strapi now.');
