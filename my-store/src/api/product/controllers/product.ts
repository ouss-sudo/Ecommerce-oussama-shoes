/**
 * product controller
 */

import { factories } from '@strapi/strapi';

const deepPopulate = {
  cover: true,
  image: true,
  gallery: true,
  categories: true,
  variants: {
    populate: {
      size_link: true,
      color_link: true
    }
  },
  reviews: true,
  model3D: true,
  textures: true
};

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.query.populate || ctx.query.populate === '*') {
      ctx.query.populate = deepPopulate as any;
    }
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },
  
  async findOne(ctx) {
    if (!ctx.query.populate || ctx.query.populate === '*') {
      ctx.query.populate = deepPopulate as any;
    }
    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  }
}));
