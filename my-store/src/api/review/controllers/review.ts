/**
 * review controller - avec vérification stricte des doublons
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::review.review' as any, ({ strapi }) => ({

    async create(ctx: any) {
        const user = ctx.state.user;
        if (!user) {
            return ctx.unauthorized('You must be logged in to leave a review.');
        }

        const { rating, comment, product } = ctx.request.body?.data || {};

        if (!rating || !product) {
            return ctx.badRequest('Rating and product are required.');
        }

        if (rating < 1 || rating > 5) {
            return ctx.badRequest('Rating must be between 1 and 5.');
        }

        // Vérification doublon via requête SQL directe (plus fiable en Strapi 5)
        const db = strapi.db.connection;

        // Trouver l'ID numérique du produit via son documentId
        const productRow = await db('products')
            .where('document_id', product)
            .select('id')
            .first();

        if (!productRow) {
            return ctx.badRequest('Product not found.');
        }

        // Vérifier si l'utilisateur a déjà une review pour ce produit
        const existingReview = await db('reviews as r')
            .join('reviews_user_lnk as ul', 'r.id', 'ul.review_id')
            .join('reviews_product_lnk as pl', 'r.id', 'pl.review_id')
            .where('ul.user_id', user.id)
            .where('pl.product_id', productRow.id)
            .select('r.id')
            .first();

        if (existingReview) {
            return ctx.badRequest('You have already reviewed this product.');
        }

        // Créer la review
        const entity = await (strapi.entityService as any).create('api::review.review', {
            data: {
                rating,
                comment: comment || null,
                username: user.username || user.email || 'Client',
                product,
                user: user.id,
            },
        });

        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitizedEntity);
    },

    async update(ctx: any) {
        const user = ctx.state.user;
        if (!user) {
            return ctx.unauthorized('You must be logged in.');
        }

        const { id } = ctx.params;

        // Vérifier le propriétaire via SQL
        const db = strapi.db.connection;
        const reviewOwner = await db('reviews as r')
            .join('reviews_user_lnk as ul', 'r.id', 'ul.review_id')
            .where('r.document_id', id)
            .where('ul.user_id', user.id)
            .select('r.id')
            .first();

        if (!reviewOwner) {
            return ctx.forbidden('You can only update your own reviews.');
        }

        return super.update(ctx);
    },

    async delete(ctx: any) {
        const user = ctx.state.user;
        if (!user) {
            return ctx.unauthorized('You must be logged in.');
        }

        const { id } = ctx.params;

        // Vérifier le propriétaire via SQL
        const db = strapi.db.connection;
        const reviewOwner = await db('reviews as r')
            .join('reviews_user_lnk as ul', 'r.id', 'ul.review_id')
            .where('r.document_id', id)
            .where('ul.user_id', user.id)
            .select('r.id')
            .first();

        if (!reviewOwner) {
            return ctx.forbidden('You can only delete your own reviews.');
        }

        return super.delete(ctx);
    },
}));
