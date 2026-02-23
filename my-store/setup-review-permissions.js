/**
 * Configure les permissions Review - Compatible Strapi 5 (SQLite)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(DB_PATH);

console.log('📂 DB:', DB_PATH);

// Rôles
const roles = db.prepare('SELECT * FROM up_roles').all();
console.log('👤 Rôles:', roles.map(r => `${r.id}:${r.type}`).join(', '));

const publicRole = roles.find(r => r.type === 'public');
const authRole = roles.find(r => r.type === 'authenticated');

// Structure de up_permissions
const permCols = db.prepare('PRAGMA table_info(up_permissions)').all();
console.log('📋 Colonnes up_permissions:', permCols.map(c => c.name).join(', '));

// Vérifier la table de liaison
const lnkCols = db.prepare('PRAGMA table_info(up_permissions_role_lnk)').all();
console.log('📋 Colonnes up_permissions_role_lnk:', lnkCols.map(c => c.name).join(', '));

// Voir permissions review existantes avec leurs rôles
const existingWithRoles = db.prepare(`
  SELECT p.id, p.action, r.type as role_type, r.id as role_id
  FROM up_permissions p
  LEFT JOIN up_permissions_role_lnk lnk ON p.id = lnk.permission_id
  LEFT JOIN up_roles r ON lnk.role_id = r.id
  WHERE p.action LIKE '%review%'
`).all();

console.log('\n📝 Permissions review existantes avec rôles:');
existingWithRoles.forEach(p => console.log(`  - ID:${p.id} [${p.role_type || 'AUCUN'}] ${p.action}`));

const now = new Date().toISOString();

// Insérer une permission et la lier à un rôle
function addPermission(action, roleId, roleName) {
    // Vérifier si la permission existe déjà pour ce rôle
    const existing = db.prepare(`
    SELECT p.id FROM up_permissions p
    JOIN up_permissions_role_lnk lnk ON p.id = lnk.permission_id
    WHERE p.action = ? AND lnk.role_id = ?
  `).get(action, roleId);

    if (existing) {
        console.log(`  ⏭️  Déjà présent: [${roleName}] ${action}`);
        return;
    }

    // Créer la permission si elle n'existe pas du tout
    let permId;
    const existingPerm = db.prepare('SELECT id FROM up_permissions WHERE action = ?').get(action);

    if (!existingPerm) {
        const result = db.prepare(
            'INSERT INTO up_permissions (action, created_at, updated_at) VALUES (?, ?, ?)'
        ).run(action, now, now);
        permId = result.lastInsertRowid;
        console.log(`  ➕ Permission créée ID:${permId} ${action}`);
    } else {
        permId = existingPerm.id;
    }

    // Lier au rôle
    const lnkCols2 = db.prepare('PRAGMA table_info(up_permissions_role_lnk)').all().map(c => c.name);

    if (lnkCols2.includes('permission_order')) {
        db.prepare(
            'INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id, permission_order) VALUES (?, ?, 0)'
        ).run(permId, roleId);
    } else {
        db.prepare(
            'INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id) VALUES (?, ?)'
        ).run(permId, roleId);
    }
    console.log(`  ✅ Lié: [${roleName}] ${action}`);
}

// Public: find + findOne
if (publicRole) {
    console.log(`\n🌍 Configuration Public (ID:${publicRole.id}):`);
    addPermission('api::review.review.find', publicRole.id, 'public');
    addPermission('api::review.review.findOne', publicRole.id, 'public');
}

// Authenticated: tout
if (authRole) {
    console.log(`\n🔒 Configuration Authenticated (ID:${authRole.id}):`);
    addPermission('api::review.review.create', authRole.id, 'authenticated');
    addPermission('api::review.review.find', authRole.id, 'authenticated');
    addPermission('api::review.review.findOne', authRole.id, 'authenticated');
    addPermission('api::review.review.update', authRole.id, 'authenticated');
    addPermission('api::review.review.delete', authRole.id, 'authenticated');
}

// Résultat final
const finalPerms = db.prepare(`
  SELECT p.action, r.type as role_type
  FROM up_permissions p
  JOIN up_permissions_role_lnk lnk ON p.id = lnk.permission_id
  JOIN up_roles r ON lnk.role_id = r.id
  WHERE p.action LIKE '%review%'
  ORDER BY r.type, p.action
`).all();

console.log('\n✅ Permissions review finales configurées:');
finalPerms.forEach(p => console.log(`  ✓ [${p.role_type}] ${p.action}`));

db.close();

console.log('\n🎉 Fait! Strapi applique les changements en temps réel.');
console.log('   Essaie de publier ton avis maintenant sur http://localhost:4173/');
