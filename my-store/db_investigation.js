const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name));

    const productCols = db.prepare("PRAGMA table_info(products)").all();
    console.log('\nProducts columns:', productCols.map(c => `${c.name} (${c.type})`));

    // Look for variants table
    const variantsTable = tables.find(t => t.name.includes('variants'));
    if (variantsTable) {
        console.log(`\nVariants table (${variantsTable.name}) columns:`,
            db.prepare(`PRAGMA table_info(${variantsTable.name})`).all().map(c => `${c.name} (${c.type})`)
        );
    }

    // Look for category table
    const categoriesTable = tables.find(t => t.name === 'categories');
    if (categoriesTable) {
        console.log('\nCategories table columns:',
            db.prepare('PRAGMA table_info(categories)').all().map(c => `${c.name} (${c.type})`)
        );
    }

    // Check link tables
    const linkTables = tables.filter(t => t.name.includes('_lnk'));
    console.log('\nLink tables:', linkTables.map(t => t.name));

} catch (err) {
    console.error(err);
} finally {
    db.close();
}
