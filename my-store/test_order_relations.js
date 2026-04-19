const strapiPath = 'c:\\Users\\Oussema\\Desktop\\strapi\\my-store';
const { createStrapi } = require('@strapi/strapi');

async function testFetch() {
  const strapi = createStrapi({ appDir: strapiPath, distDir: strapiPath + '\\dist' });
  await strapi.load();
  
  try {
    const orders = await strapi.entityService.findMany('api::order.order', {
      populate: {
        items: {
          populate: {
            product: {
              populate: ['cover']
            }
          }
        }
      }
    });
    console.log(JSON.stringify(orders.slice(0, 2), null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

testFetch();
