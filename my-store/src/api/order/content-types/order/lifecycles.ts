
export default {
  async afterCreate(event) {
    const { result } = event;
    await awardPoints(result.documentId);
  },

  async afterUpdate(event) {
    const { result } = event;
    await awardPoints(result.documentId);
  },
};

async function awardPoints(documentId) {
  try {
    const order = await strapi.documents('api::order.order').findOne({
      documentId,
      populate: ['user'],
    });

    if (order && order.paymentStatus === 'paid' && !order.pointsAwarded && order.user) {
      const pointsToAdd = Math.floor(Number(order.total));
      
      if (pointsToAdd > 0) {
        // Fetch the user to get current points
        const user = await strapi.documents('plugin::users-permissions.user').findOne({
          documentId: order.user.documentId,
        });

        const currentPoints = user.loyaltyPoints || 0;
        const newTotalPoints = currentPoints + pointsToAdd;

        // Determine loyalty level (optional but good for a premium feel)
        let newLevel = user.loyaltyLevel || 'BRONZE';
        if (newTotalPoints >= 2000) newLevel = 'GOLD';
        else if (newTotalPoints >= 500) newLevel = 'SILVER';

        // Update user points and level
        await strapi.documents('plugin::users-permissions.user').update({
          documentId: user.documentId,
          data: {
            loyaltyPoints: newTotalPoints,
            loyaltyLevel: newLevel,
          },
        });

        // Mark the order as points awarded to prevent duplicate processing
        // We use strapi.db.query here to avoid re-triggering lifecycle hooks if possible, 
        // OR we just rely on the !order.pointsAwarded check above.
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            pointsAwarded: true,
          },
        });

        strapi.log.info(`Loyalty: Awarded ${pointsToAdd} points to user ${user.username} (Level: ${newLevel})`);
      }
    }
  } catch (error) {
    strapi.log.error('Error awarding loyalty points:', error);
  }
}
