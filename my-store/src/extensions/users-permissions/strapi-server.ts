import * as bcrypt from 'bcryptjs';

export default (plugin: any) => {
  // --- DEBUG ROUTE STRUCTURE ---
  console.log('--- USERS-PERMISSIONS PLUGIN STRUCTURE ---');
  if (plugin.routes && plugin.routes['content-api']) {
    console.log('Routes found. Inspecting /auth/local/register...');
    plugin.routes['content-api'].routes = plugin.routes['content-api'].routes.map((route: any) => {
      if (route.method === 'POST' && route.path === '/auth/local/register') {
        console.log('Target route found! Current config:', JSON.stringify(route.config));
        return {
          ...route,
          config: {
            ...route.config,
            validate: false,
            middlewares: [],
            policies: []
          }
        };
      }
      return route;
    });
  }

  // Add lifecycles to fix Strapi Admin Panel plain text password issue
  if (!plugin.contentTypes.user.schema.lifecycles) {
    plugin.contentTypes.user.schema.lifecycles = {};
  }

  const hashPassword = async (event: any) => {
    const { data } = event.params;

    // --- SÉCURITÉ XSS : VALIDATION STRICTE (BLOQUAGE) ---
    const hasScript = (val: any) => typeof val === 'string' && /<\/?[^>]+(>|$)/g.test(val);
    const fieldsToCheck = ['firstName', 'lastName', 'phone', 'address', 'city', 'postalCode'];
    
    fieldsToCheck.forEach(field => {
      if (hasScript(data[field])) {
        throw new Error(`Security Error: HTML tags are not allowed in ${field}`);
      }
    });

    if (data.password) {
      // Check if it's already hashed by users-permissions plugin
      const isAlreadyHashed = 
        (data.password.startsWith('$2a$') || 
         data.password.startsWith('$2b$') || 
         data.password.startsWith('$2y$')) && 
        data.password.length === 60;
        
      if (!isAlreadyHashed) {
        data.password = await bcrypt.hash(data.password, 10);
      }
    }
  };

  const oldBeforeCreate = plugin.contentTypes.user.schema.lifecycles.beforeCreate;
  plugin.contentTypes.user.schema.lifecycles.beforeCreate = async (event: any) => {
    if (oldBeforeCreate) await oldBeforeCreate(event);
    await hashPassword(event);
  };

  const oldBeforeUpdate = plugin.contentTypes.user.schema.lifecycles.beforeUpdate;
  plugin.contentTypes.user.schema.lifecycles.beforeUpdate = async (event: any) => {
    if (oldBeforeUpdate) await oldBeforeUpdate(event);
    await hashPassword(event);
  };

  // --- FIX FOR CUSTOM REGISTRATION FIELDS ---
  const originalRegister = plugin.controllers.auth.register;
  
  plugin.controllers.auth.register = async (ctx: any) => {
    console.log('--- CUSTOM REGISTER START ---');
    console.log('Request Body:', ctx.request.body);
    
    // 1. Extraire les paramètres personnalisés pour éviter l'erreur "Invalid Parameters"
    const customFields = {
      gender: ctx.request.body.gender,
      firstName: ctx.request.body.firstName,
      lastName: ctx.request.body.lastName,
      birthDate: ctx.request.body.birthDate,
      newsletterOptIn: ctx.request.body.newsletterOptIn,
      partnersOptIn: ctx.request.body.partnersOptIn,
    };

    // 2. Supprimer ces paramètres du corps de la requête avant la validation stricte
    delete ctx.request.body.gender;
    delete ctx.request.body.firstName;
    delete ctx.request.body.lastName;
    delete ctx.request.body.birthDate;
    delete ctx.request.body.newsletterOptIn;
    delete ctx.request.body.partnersOptIn;

    // 3. Laisser Strapi gérer l'inscription "standard"
    await originalRegister(ctx);

    // 4. Si l'inscription réussit, mettre à jour l'utilisateur en tâche de fond avec les autres champs
    if (ctx.response && ctx.response.status === 200 && ctx.response.body && ctx.response.body.user) {
      const userId = ctx.response.body.user.id;
      
      await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: customFields,
      });

      // Mettre à jour les données dans la réponse renvoyée au frontend
      ctx.response.body.user = {
        ...ctx.response.body.user,
        ...customFields
      };
    }
  };

  return plugin;
};
