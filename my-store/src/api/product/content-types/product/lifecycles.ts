
export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (data.price_display) {
      const numericPrice = parseFloat(String(data.price_display).replace(/[^0-9,.]/g, '').replace(',', '.'));
      if (!isNaN(numericPrice)) data.price = numericPrice;
    }
    if (data.variants && Array.isArray(data.variants)) {
      const uniqueSizesSet = new Set<string>();
      const uniqueColorsSet = new Set<string>();
      for (let v of data.variants) {
        if (v.size_link) {
          const s = await strapi.entityService.findOne('api::size.size', v.size_link);
          if (s) { v.size = s.name; uniqueSizesSet.add(s.name); }
        } else if (v.size) uniqueSizesSet.add(v.size);
        if (v.color_link) {
          const c = await strapi.entityService.findOne('api::color.color', v.color_link);
          if (c) { v.color = c.name; uniqueColorsSet.add(c.name); }
        } else if (v.color) uniqueColorsSet.add(v.color);
      }
      if (uniqueSizesSet.size > 0) data.sizes = { sizes: Array.from(uniqueSizesSet) };
      if (uniqueColorsSet.size > 0) data.colors = { colors: Array.from(uniqueColorsSet) };
    }
  },
  async beforeUpdate(event: any) {
    const { data } = event.params;
    if (data.price_display) {
      const numericPrice = parseFloat(String(data.price_display).replace(/[^0-9,.]/g, '').replace(',', '.'));
      if (!isNaN(numericPrice)) data.price = numericPrice;
    }
    if (data.variants && Array.isArray(data.variants)) {
      const uniqueSizesSet = new Set<string>();
      const uniqueColorsSet = new Set<string>();
      for (let v of data.variants) {
        if (v.size_link) {
          const s = await strapi.entityService.findOne('api::size.size', v.size_link);
          if (s) { v.size = s.name; uniqueSizesSet.add(s.name); }
        } else if (v.size) uniqueSizesSet.add(v.size);
        if (v.color_link) {
          const c = await strapi.entityService.findOne('api::color.color', v.color_link);
          if (c) { v.color = c.name; uniqueColorsSet.add(c.name); }
        } else if (v.color) uniqueColorsSet.add(v.color);
      }
      if (uniqueSizesSet.size > 0) data.sizes = { sizes: Array.from(uniqueSizesSet) };
      if (uniqueColorsSet.size > 0) data.colors = { colors: Array.from(uniqueColorsSet) };
    }
  },
};
