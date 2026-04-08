import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::visitor.visitor', ({ strapi }) => ({
    async ping(ctx) {
        const { identifier, page } = ctx.request.body;

        if (!identifier) {
            return ctx.badRequest('Identifier is required');
        }

        const now = new Date();

        // Find or Create visitor
        let visitor = await strapi.db.query('api::visitor.visitor').findOne({
            where: { identifier }
        });

        if (visitor) {
            await strapi.db.query('api::visitor.visitor').update({
                where: { id: visitor.id },
                data: {
                    last_seen: now,
                    page_visited: page || visitor.page_visited,
                    is_online: true
                }
            });
        } else {
            await strapi.db.query('api::visitor.visitor').create({
                data: {
                    identifier,
                    last_seen: now,
                    page_visited: page || 'Home',
                    is_online: true
                }
            });
        }

        // Get stats
        const totalVisitors = await strapi.db.query('api::visitor.visitor').count();

        // Active now: last_seen in the last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const activeNow = await strapi.db.query('api::visitor.visitor').count({
            where: {
                last_seen: { $gte: twoMinutesAgo }
            }
        });

        return {
            totalVisitors,
            activeNow
        };
    }
}));
