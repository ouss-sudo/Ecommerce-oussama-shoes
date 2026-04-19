const strapi = require('@strapi/strapi');

async function main() {
  const app = await strapi().load();
  
  const documentId = 'ene49r98kuqxmgptm0aa435e'; // Order 2 which is linked to user 6
  const order = await app.documents('api::order.order').findOne({
    documentId,
    populate: ['user'],
  });

  console.log("Order fetched:", order);

  if (order && order.paymentStatus === 'paid' && !order.pointsAwarded && order.user) {
    console.log("Would award points!");
    console.log("User doc ID:", order.user.documentId);
    
    // fetch user
    const user = await app.documents('plugin::users-permissions.user').findOne({
      documentId: order.user.documentId,
    });
    console.log("Fetched User:", user);
  } else {
    console.log("Condition not met.");
  }
}

main().catch(console.error).finally(() => process.exit());
