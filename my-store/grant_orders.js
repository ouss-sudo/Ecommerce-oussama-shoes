const { createStrapi } = require('@strapi/strapi');

async function grant() {
  const strapi = createStrapi({ appDir: __dirname, distDir: __dirname + '/dist' });
  await strapi.load();
  
  try {
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    if (publicRole) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action: 'api::order.order.find',
          role: publicRole.id,
        }
      });
      console.log('Granted find permission on orders to public role.');
    }
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
       console.log('Permission already exists.');
    } else {
       console.error(err);
    }
  }
  process.exit(0);
}
grant();
