const { createStrapi } = require('@strapi/strapi');

async function grantPermissions() {
  const strapi = createStrapi({ appDir: __dirname, distDir: __dirname + '/dist' });
  await strapi.load();
  
  try {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({
      where: { type: { $in: ['public', 'authenticated'] } }
    });

    for (const role of roles) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: 'api::order-item.order-item.find', role: role.id }
      });
      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action: 'api::order-item.order-item.find', role: role.id }
        });
        console.log(`Granted find for order-item to role ${role.type}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

grantPermissions();
