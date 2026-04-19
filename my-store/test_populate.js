const strapi = require('@strapi/strapi');

async function main() {
  const app = await strapi.createStrapi().load();
  const orders = await app.entityService.findMany('api::order.order', {
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

  console.log(JSON.stringify(orders[0], null, 2));
}

main().then(() => process.exit()).catch(e => { console.error(e); process.exit(1); });
