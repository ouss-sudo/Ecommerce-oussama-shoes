export default {
  routes: [
    {
      method: 'POST',
      path: '/coupons/validate',
      handler: 'coupon.validate',
      config: {
        auth: false,
      },
    },
    // Include core routes
    {
      method: 'GET',
      path: '/coupons',
      handler: 'coupon.find',
    },
    {
      method: 'GET',
      path: '/coupons/:id',
      handler: 'coupon.findOne',
    }
  ],
};
