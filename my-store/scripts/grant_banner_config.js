
async function grantPermissions() {
  try {
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (publicRole) {
      await strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: 'api::banner-config.banner-config.find',
          role: publicRole.id,
        },
      });
      console.log('Permissions granted for BannerConfig find');
    }
  } catch (err) {
    console.error('Error granting permissions:', err);
  }
}

module.exports = grantPermissions;
