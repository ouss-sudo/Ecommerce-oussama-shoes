import type { Core } from '@strapi/strapi';

export default ((config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    // Set headers on the way IN so they persist through auth exceptions
    ctx.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    ctx.set('X-Content-Type-Options', 'nosniff');
    ctx.set('X-Frame-Options', 'DENY');
    ctx.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
    ctx.remove('X-Powered-By');

    await next();
  };
});
