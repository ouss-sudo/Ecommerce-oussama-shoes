/**
 * cart router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/cart/validate',
      handler: 'cart.validate',
      config: {
        auth: false, // Publicly available for cart preview
      },
    },
    {
      method: 'POST',
      path: '/orders/create-from-cart',
      handler: 'cart.createOrder',
      config: {
        // Can be restricted to authenticated or left public for guest checkout
        auth: false, 
      },
    },
  ],
};
