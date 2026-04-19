const db = require('better-sqlite3')('.tmp/data.db');

console.log("Creating default Flash Sale entry...");

try {
    // 1. Create the entry in 'flash_sales' table
    // Use document_id because it's Strapi v5
    const docId = 'flash-sale-default-doc-id';
    
    // Check if table exists (it should have been created by Strapi startup)
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='flash_sales'").get();
    
    if (tableExists) {
        const count = db.prepare("SELECT count(*) as total FROM flash_sales").get().total;
        if (count === 0) {
            db.prepare(`
                INSERT INTO flash_sales (document_id, title, is_active, end_at, created_at, updated_at, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                docId, 
                'Offres Spéciales', 
                0, // isActive = false by default
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
                Date.now(), 
                Date.now(),
                Date.now()
            );
            console.log("Default entry created.");
        } else {
            console.log("Entry already exists.");
        }
    } else {
        console.log("Table 'flash_sales' does not exist yet. Strapi needs another restart or build.");
    }

} catch (err) {
    console.error("Error creating default entry:", err);
}
