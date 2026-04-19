import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::coupon.coupon', ({ strapi }) => ({
  async validate(ctx) {
    try {
      const { code, subtotal } = ctx.request.body;
      if (!code) return ctx.badRequest('Coupon code is required.');

      // We can reuse the cart logic even if items are empty, just for coupon check
      const result = await strapi.service('api::cart.cart').validateCart([], code);
      
      // But actually, validateCart expects subtotal from items. 
      // Let's create a specific check or pass a dummy subtotal if needed.
      // Re-implementing a simpler check here for just the coupon existence and validity.
      
      const coupons = await strapi.entityService.findMany('api::coupon.coupon', {
        filters: { code: code.toUpperCase(), active: true },
        limit: 1
      });

      const coupon = coupons[0];

      if (!coupon) return ctx.notFound('Coupon not found.');

      const now = new Date();
      if (coupon.expirationDate && new Date(coupon.expirationDate) < now) {
        return ctx.badRequest('Coupon has expired.');
      }

      if (coupon.timesUsed >= coupon.usageLimit) {
        return ctx.badRequest('Usage limit reached.');
      }

      return {
        valid: true,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount
      };
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  }
}));
