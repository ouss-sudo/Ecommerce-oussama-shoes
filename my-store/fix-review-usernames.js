/**
 * Ajoute la colonne 'username' à la table 'reviews' 
 * et corrige les avis existants sans nom
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '.tmp', 'data.db');

// On ouvre en readonly d'abord pour vérifier
let db;
try {
    db = new Database(DB_PATH);

    console.log('📂 Base de données ouverte');

    // Vérifier si la colonne username existe déjà
    const cols = db.prepare('PRAGMA table_info(reviews)').all();
    console.log('📋 Colonnes reviews:', cols.map(c => c.name).join(', '));

    const hasUsername = cols.find(c => c.name === 'username');

    if (!hasUsername) {
        console.log('\n➕ Ajout de la colonne username...');
        db.prepare("ALTER TABLE reviews ADD COLUMN username TEXT").run();
        console.log('✅ Colonne username ajoutée!');
    } else {
        console.log('\n✅ Colonne username déjà présente.');
    }

    // Récupérer les avis sans username et les corriger avec les données user
    const reviewsWithoutUsername = db.prepare(`
    SELECT r.id, r.document_id, u.username as user_name
    FROM reviews r
    LEFT JOIN reviews_user_lnk lnk ON r.id = lnk.review_id
    LEFT JOIN up_users u ON lnk.user_id = u.id
    WHERE r.username IS NULL OR r.username = ''
  `).all();

    console.log(`\n🔍 Avis sans username: ${reviewsWithoutUsername.length}`);

    if (reviewsWithoutUsername.length > 0) {
        const updateStmt = db.prepare("UPDATE reviews SET username = ? WHERE id = ?");
        reviewsWithoutUsername.forEach(r => {
            const name = r.user_name || 'Client';
            updateStmt.run(name, r.id);
            console.log(`  ✅ Avis ID:${r.id} → username="${name}"`);
        });
    }

    // Vérification finale
    const allReviews = db.prepare(`
    SELECT r.id, r.username, r.rating, u.username as db_user
    FROM reviews r
    LEFT JOIN reviews_user_lnk lnk ON r.id = lnk.review_id
    LEFT JOIN up_users u ON lnk.user_id = u.id
  `).all();

    console.log('\n📊 Avis actuels:');
    allReviews.forEach(r => {
        console.log(`  ID:${r.id} ⭐${r.rating} username="${r.username}" (db_user="${r.db_user}")`);
    });

    db.close();
    console.log('\n🎉 Terminé! Redémarre le frontend pour voir les changements:');
    console.log('   npm run preview -- --port 4173 (dans client/)');

} catch (err) {
    if (db) db.close();
    console.error('❌ Erreur:', err.message);
}
