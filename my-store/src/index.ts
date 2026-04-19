import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // --- GLOBAL FIX FOR CUSTOM REGISTRATION FIELDS ---
    console.log('--- SYSTEM: Registering Custom Registration Handler ---');
    const plugin = strapi.plugin('users-permissions');

    // 1. Disable Route-Level Validation
    if (plugin.routes['content-api'] && plugin.routes['content-api'].routes) {
      plugin.routes['content-api'].routes.forEach((route: any) => {
        if (route.method === 'POST' && route.path === '/auth/local/register') {
          console.log('--- SYSTEM: Found register route, disabling yup validation ---');
          route.config.validate = false;
          if (route.config.middlewares) {
            route.config.middlewares = route.config.middlewares.filter((m: any) => m !== 'validate');
          }
        }
      });
    }

    // 2. Override Controller
    const originalRegister = plugin.controllers.auth.register;
    plugin.controllers.auth.register = async (ctx: any) => {
      console.log('--- CUSTOM REGISTER EXECUTION ---');
      
      // Sécurité Stricte : Bloquer complètement si un script est détecté
      const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);
      
      const customData = {
        gender: ctx.request.body.gender,
        firstName: ctx.request.body.firstName,
        lastName: ctx.request.body.lastName,
        birthDate: ctx.request.body.birthDate,
        newsletterOptIn: ctx.request.body.newsletterOptIn,
        partnersOptIn: ctx.request.body.partnersOptIn,
      };

      if (Object.values(customData).some(hasScript)) {
        return ctx.badRequest('Security Error: HTML tags are not allowed in profile fields.');
      }

      // Scrub body
      delete ctx.request.body.gender;
      delete ctx.request.body.firstName;
      delete ctx.request.body.lastName;
      delete ctx.request.body.birthDate;
      delete ctx.request.body.newsletterOptIn;
      delete ctx.request.body.partnersOptIn;

      await originalRegister(ctx, async () => {});

      if (ctx.response && ctx.response.status === 200 && ctx.response.body && ctx.response.body.user) {
         await strapi.query('plugin::users-permissions.user').update({
            where: { id: ctx.response.body.user.id },
            data: customData
         });
         ctx.response.body.user = { ...ctx.response.body.user, ...customData };
      }
    };
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      strapi.log.info('BOOTSTRAP: Starting email template update...');

      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'users-permissions',
      });

      const emailSettings = await pluginStore.get({ key: 'email' }) as any;

      if (emailSettings) {
        strapi.log.info('BOOTSTRAP: Current settings found. Checking structure...');

        // Check if we have 'reset_password' or 'email_reset_password'
        const resetPasswordSettings = emailSettings.reset_password || emailSettings.email_reset_password;

        if (resetPasswordSettings) {
          strapi.log.info('BOOTSTRAP: Updating Reset Password template...');
          resetPasswordSettings.options.message = `
<p>Vous avez fait une demande de réinitialisation de mot de passe.</p>
<p>Pour définir un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
<p><a href="http://localhost:4173/reset-password?code=<%= CODE %>" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
<p>Ou copiez ce lien dans votre navigateur :<br/>http://localhost:4173/reset-password?code=<%= CODE %></p>
<p>Merci.</p>
`;
          resetPasswordSettings.options.object = 'Réinitialisation de mot de passe - Oussama Shoes';

          await pluginStore.set({ key: 'email', value: emailSettings });
          strapi.log.info('BOOTSTRAP: Email template for reset password updated successfully.');
        } else {
          strapi.log.warn('BOOTSTRAP: Could not find reset_password or email_reset_password key in settings.');
          strapi.log.warn(JSON.stringify(emailSettings));
        }

      } else {
        strapi.log.warn('BOOTSTRAP: No email settings found in users-permissions store.');
      }

      // --- NEW: Set Public Permissions for Visitor Tracking ---
      strapi.log.info('BOOTSTRAP: Setting Public permissions for Visitor API...');
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' }
      });

      if (publicRole) {
        // Define permissions we want to enable for Public
        const permissions = [
          { action: 'api::visitor.visitor.ping' },
          { action: 'api::user-upload.user-upload.upload' },
          { action: 'api::banner-config.banner-config.find' },
          { action: 'api::product.product.find' },
          { action: 'api::product.product.findOne' },
          { action: 'api::category.category.find' },
          { action: 'api::category.category.findOne' },
          { action: 'api::flash-sale.flash-sale.find' },
          { action: 'api::coupon.coupon.validate' },
          { action: 'api::cart.cart.validate' },
          { action: 'api::cart.cart.createOrder' },
          { action: 'plugin::upload.content-api.find' }, // Grant public access to see images
        ];

        for (const permission of permissions) {
          try {
            const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({
              where: { role: publicRole.id, action: permission.action }
            });

            if (!exists) {
              await strapi.db.query('plugin::users-permissions.permission').create({
                data: {
                  role: publicRole.id,
                  action: permission.action
                }
              });
              strapi.log.info(`BOOTSTRAP: Enabled ${permission.action} for Public role.`);
            }
          } catch(e) {
            strapi.log.warn(`BOOTSTRAP: Error enabling ${permission.action}: ${e.message}`);
          }
        }
      }

      // --- NEW: Set Authenticated Permissions for Upload ---
      strapi.log.info('BOOTSTRAP: Setting Authenticated permissions for Upload API...');
      const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' }
      });

      if (authenticatedRole) {
        const permissions = [
          { action: 'plugin::upload.api.upload' },
          { action: 'plugin::upload.upload.upload' },
          { action: 'plugin::upload.content-api.upload' },
          { action: 'plugin::upload.content-api.find' }, // Allow seeing images
          { action: 'api::product.product.find' },
          { action: 'api::product.product.findOne' },
          { action: 'api::category.category.find' },
          { action: 'api::category.category.findOne' },
          { action: 'api::banner-config.banner-config.find' },
          { action: 'api::flash-sale.flash-sale.find' },
          { action: 'api::coupon.coupon.validate' },
          { action: 'api::cart.cart.validate' },
          { action: 'api::cart.cart.createOrder' },
          { action: 'api::visitor.visitor.ping' },
          { action: 'api::order.order.find' },
        ];

        for (const permission of permissions) {
          try {
              const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({
                where: { role: authenticatedRole.id, action: permission.action }
              });

              if (!exists) {
                await strapi.db.query('plugin::users-permissions.permission').create({
                  data: {
                    role: authenticatedRole.id,
                    action: permission.action
                  }
                });
                strapi.log.info(`BOOTSTRAP: Enabled ${permission.action} for Authenticated role.`);
              }
          } catch(e) { /* ignore invalid actions */ }
        }
      }

      // --- NEW: Sync Sizes and Colors collections from existing product data ---
      strapi.log.info('BOOTSTRAP: Synchronizing Sizes and Colors collections...');
      const pData = await strapi.entityService.findMany('api::product.product');
      for (const p of (pData as any[])) {
        if (p.sizes) {
          const sList = Array.isArray(p.sizes) ? p.sizes : (p.sizes.sizes || []);
          for (const name of sList) {
            const existing = await strapi.entityService.findMany('api::size.size', { filters: { name: String(name) } });
            if (existing.length === 0) await strapi.entityService.create('api::size.size', { data: { name: String(name) } });
          }
        }
        if (p.colors) {
          const cList = Array.isArray(p.colors) ? p.colors : (p.colors.colors || []);
          for (const name of cList) {
            const existing = await strapi.entityService.findMany('api::color.color', { filters: { name: String(name) } });
            if (existing.length === 0) await strapi.entityService.create('api::color.color', { data: { name: String(name) } });
          }
        }
      }
      strapi.log.info('BOOTSTRAP: Metadata synchronization complete.');

    } catch (error) {
      strapi.log.error('BOOTSTRAP: Failed during bootstrap:', error);
    }
  },
};
