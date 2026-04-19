
const strapi = require('@strapi/strapi');

async function migrate() {
  const app = await strapi().load();
  
  console.log('--- DÉMARRAGE DE LA MIGRATION DES TAILLES ET COULEURS ---');

  // 1. Récupérer tous les produits
  const products = await app.entityService.findMany('api::product.product');
  
  const allSizes = new Set();
  const allColors = new Set();

  products.forEach(p => {
    // Extraire les tailles
    if (p.sizes) {
      const sList = Array.isArray(p.sizes) ? p.sizes : (p.sizes.sizes || []);
      sList.forEach(s => allSizes.add(String(s)));
    }
    // Extraire les couleurs
    if (p.colors) {
      const cList = Array.isArray(p.colors) ? p.colors : (p.colors.colors || []);
      cList.forEach(c => allColors.add(String(c)));
    }
  });

  console.log(`Tailles trouvées : ${Array.from(allSizes).join(', ')}`);
  console.log(`Couleurs trouvées : ${Array.from(allColors).join(', ')}`);

  // 2. Créer les entités Size
  for (const name of allSizes) {
    const existing = await app.entityService.findMany('api::size.size', { filters: { name } });
    if (existing.length === 0) {
      await app.entityService.create('api::size.size', { data: { name } });
      console.log(`Taille créée : ${name}`);
    }
  }

  // 3. Créer les entités Color
  for (const name of allColors) {
    const existing = await app.entityService.findMany('api::color.color', { filters: { name } });
    if (existing.length === 0) {
      await app.entityService.create('api::color.color', { data: { name } });
      console.log(`Couleur créée : ${name}`);
    }
  }

  console.log('--- MIGRATION TERMINÉE AVEC SUCCÈS ---');
  process.exit(0);
}

migrate();
