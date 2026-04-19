import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to view your orders.");
    }

    ctx.query = {
      ...ctx.query,
      filters: {
        ...((ctx.query.filters as any) || {}),
        user: { id: user.id }
      },
      populate: {
        items: {
          populate: {
            product: {
              populate: ['cover', 'image', 'gallery']
            }
          }
        }
      }
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  }
}));
