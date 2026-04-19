
async function checkProduct() {
  const products = await strapi.entityService.findMany('api::product.product', {
    fields: ['id', 'name', 'active'],
    limit: 10
  });
  console.log('Last 10 products:', JSON.stringify(products, null, 2));
  
  const p104 = await strapi.entityService.findOne('api::product.product', 104);
  console.log('Product 104:', p104);
}

module.exports = checkProduct;
