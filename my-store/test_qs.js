const axios = require('axios');
const qs = require('qs');

const query = {
  filters: {
    $or: [
      { slug: { $eq: 'p0dr3wvuzur6k2oev1n52p6l' } },
      { documentId: { $eq: 'p0dr3wvuzur6k2oev1n52p6l' } }
    ]
  },
  populate: {
    cover: true,
    image: true,
    gallery: true,
    categories: true,
    brand: true,
    sizes: true,
    colors: true,
    variants: {
      populate: {
        size_link: true,
        color_link: true
      }
    }
  }
};

const str = qs.stringify(query, { encodeValuesOnly: true });
console.log(str);
