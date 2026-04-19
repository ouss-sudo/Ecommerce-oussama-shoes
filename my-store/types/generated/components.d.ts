import type { Schema, Struct } from '@strapi/strapi';

export interface ProductVariant extends Struct.ComponentSchema {
  collectionName: 'components_product_variants';
  info: {
    description: 'Stock management by size and color';
    displayName: 'Variant';
    icon: 'list';
  };
  attributes: {
    color_link: Schema.Attribute.Relation<'oneToOne', 'api::color.color'>;
    price_modifier: Schema.Attribute.Decimal;
    size_link: Schema.Attribute.Relation<'oneToOne', 'api::size.size'>;
    stock: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product.variant': ProductVariant;
    }
  }
}
