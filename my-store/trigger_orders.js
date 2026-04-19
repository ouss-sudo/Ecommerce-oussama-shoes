const strapi = require('@strapi/strapi');

async function main() {
  const app = await strapi.createStrapi().load();
  
  const orderDocs = await app.documents('api::order.order').findMany({
    filters: { paymentStatus: 'paid' },
    populate: ['user']
  });
  console.log("Found orders:");
  for (const o of orderDocs) {
    if (o.user) {
         console.log("Order ID:", o.id, "DocumentId:", o.documentId, "User Doc ID:", o.user.documentId);
         
         // Trigger points update manually to test the function:
         try {
             // Just call update to trigger the lifecycle
             await app.documents('api::order.order').update({
                 documentId: o.documentId,
                 data: { paymentStatus: 'paid' } // This should trigger afterUpdate
             });
             console.log("Triggered update for order:", o.documentId);
         } catch(e) {
             console.log("Error updating:", e);
         }
    } else {
         console.log("Order ID:", o.id, "has no user linked.");
    }
  }
}

main().then(() => process.exit()).catch(e => { console.error(e); process.exit(1); });
