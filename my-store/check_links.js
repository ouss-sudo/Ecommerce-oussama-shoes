const sqlite3 = require('better-sqlite3');
const db = new sqlite3('.tmp/data.db');

try {
  console.log(db.prepare('SELECT * FROM components_product_variants_size_link_lnk').all());
} catch(e) { console.log(e.message); }

try {
  console.log(db.prepare('SELECT * FROM components_product_variants_color_link_lnk').all());
} catch(e) { console.log(e.message); }
