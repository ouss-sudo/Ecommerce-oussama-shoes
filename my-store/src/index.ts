import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Left empty, we will use schema.json extension.
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
          { action: 'api::user-upload.user-upload.upload' }, // Allow upload for ALL (auth check done in controller)
        ];

        for (const permission of permissions) {
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

    } catch (error) {
      strapi.log.error('BOOTSTRAP: Failed during bootstrap:', error);
    }
  },
};
