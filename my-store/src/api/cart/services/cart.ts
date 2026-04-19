/**
 * cart service
 */

export default () => ({
  async validateCart(items, couponCode = null) {
    let subtotal = 0;
    const validatedItems = [];

    // 1. Validate Products & Prices & Stock
    for (const item of items) {
      let product;
      
      // Try finding by internal ID or DocumentID using DB query for flexibility
      if (typeof item.id === 'string' && item.id.length > 5) {
        product = await strapi.db.query('api::product.product').findOne({
          where: { documentId: item.id },
          populate: ['variants', 'variants.size_link', 'variants.color_link']
        });
      } else {
        product = await strapi.db.query('api::product.product').findOne({
          where: { id: item.id },
          populate: ['variants', 'variants.size_link', 'variants.color_link']
        });
        
        if (!product && item.documentId) {
          product = await strapi.db.query('api::product.product').findOne({
            where: { documentId: item.documentId },
            populate: ['variants', 'variants.size_link', 'variants.color_link']
          });
        }
      }

      if (!product || !product.active) {
        throw new Error(`Product ${item.id} is not available.`);
      }

      // Check variant stock first
      let stockToCheck = product.stock !== null ? product.stock : 0;
      let usingVariantStock = false;

      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v: any) => {
            const vSize = v.size_link ? v.size_link.name : v.size;
            const vColor = v.color_link ? v.color_link.name : v.color;
            return String(vSize) === String(item.selectedSize) &&
                   (!vColor || !item.selectedColor || vColor.toLowerCase() === item.selectedColor.toLowerCase());
        });
        if (variant) {
            stockToCheck = variant.stock !== null ? variant.stock : 0;
            usingVariantStock = true;
        } else if (product.stock === null) {
            // Default to max if no variant strictly configured and global is null (soft validation)
             stockToCheck = 999;
        }
      } else if (product.stock === null) {
          stockToCheck = 999; 
      }

      if (stockToCheck < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${stockToCheck}`);
      }

      const unitPrice = product.salePrice || product.price;
      const itemTotal = unitPrice * item.quantity;
      
      subtotal += itemTotal;
      validatedItems.push({
        id: item.id,
        documentId: product.documentId, // Ensure we have the Strapi 5 documentId
        name: product.name,
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
        total: itemTotal,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor
      });
    }

    // 2. Coupon Logic
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupons = await strapi.entityService.findMany('api::coupon.coupon', {
        filters: { code: couponCode, active: true },
        limit: 1
      });

      const coupon = coupons[0];

      if (!coupon) throw new Error('Invalid coupon code.');
      
      const now = new Date();
      if (coupon.expirationDate && new Date(coupon.expirationDate) < now) {
        throw new Error('Coupon has expired.');
      }

      if (coupon.timesUsed >= coupon.usageLimit) {
        throw new Error('Coupon usage limit reached.');
      }

      if (subtotal < coupon.minOrderAmount) {
        throw new Error(`Minimum order amount for this coupon is ${coupon.minOrderAmount} TND.`);
      }

      if (coupon.type === 'percentage') {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.value;
      }

      // Ensure discount doesn't exceed subtotal
      if (discount > subtotal) discount = subtotal;
      
      appliedCoupon = coupon;
    }

    // 3. Shipping Logic (Free over 150 TND)
    const shippingFee = subtotal > 150 ? 0 : 8; // Fixed 8 TND shipping

    return {
      items: validatedItems,
      subtotal: parseFloat(subtotal.toFixed(3)),
      discount: parseFloat(discount.toFixed(3)),
      shippingFee: parseFloat(shippingFee.toFixed(3)),
      total: parseFloat((subtotal - discount + shippingFee).toFixed(3)),
      coupon: appliedCoupon ? { id: appliedCoupon.id, code: appliedCoupon.code } : null
    };
  }
});
