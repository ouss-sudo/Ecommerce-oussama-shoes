/**
 * cart controller
 */

export default {
  async validate(ctx) {
    try {
      const { items, couponCode } = ctx.request.body;
      
      if (!items || !Array.isArray(items)) {
        return ctx.badRequest('Items array is required.');
      }

      const result = await strapi.service('api::cart.cart').validateCart(items, couponCode);
      return result;
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async createOrder(ctx) {
    try {
      const { cartItems, couponCode, customerDetails, userId } = ctx.request.body;

      if (!customerDetails || !customerDetails.phone || !customerDetails.address || !customerDetails.email) {
        return ctx.badRequest('Customer information is incomplete.');
      }

      // 1. Re-validate on server (Sanitization)
      const validatedCart = await strapi.service('api::cart.cart').validateCart(cartItems, couponCode);

      // 2. Decrement Stock safely (with support for Variants)
      for (const item of validatedCart.items) {
        const product: any = await strapi.entityService.findOne('api::product.product', item.id, {
          populate: ['variants', 'variants.size_link', 'variants.color_link']
        });
        
        if (!product) continue;

        const updates: any = {};
        
        // SUPPORT DES VARIANTES: On cherche la variante qui correspond au choix du client
        if (product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex((v: any) => {
                const vSize = v.size_link ? v.size_link.name : v.size;
                const vColor = v.color_link ? v.color_link.name : v.color;
                return String(vSize) === String(item.selectedSize) && 
                       (!vColor || !item.selectedColor || vColor.toLowerCase() === item.selectedColor.toLowerCase());
            });

            if (variantIndex !== -1) {
                // On met à jour la liste des variantes avec le nouveau stock
                const newVariants = [...product.variants];
                newVariants[variantIndex].stock = Math.max(0, (newVariants[variantIndex].stock || 0) - item.quantity);
                updates.variants = newVariants;
            }
        }

        // Toujours décrémenter le stock global pour la cohérence
        if (typeof product.stock === 'number') {
            updates.stock = Math.max(0, product.stock - item.quantity);
        }

        if (Object.keys(updates).length > 0) {
            await strapi.entityService.update('api::product.product', item.id, {
                data: updates
            });
        }
      }

      // 3. Create Order
      const order = await strapi.entityService.create('api::order.order', {
        data: {
          customer: customerDetails,
          subtotal: validatedCart.subtotal,
          discount: validatedCart.discount,
          shippingFee: validatedCart.shippingFee,
          total: validatedCart.total,
          couponCode: validatedCart.coupon?.code,
          coupon: validatedCart.coupon?.documentId || validatedCart.coupon?.id, // Simplified for link
          paymentMethod: 'cash_on_delivery',
          status: 'pending',
          paymentStatus: 'pending',
          user: userId || (ctx.state.user ? ctx.state.user.id : null),
        }
      });

      // 4. Create Order Items (Snapshots)
      let itemsListHtml = '';
      for (const item of validatedCart.items) {
        // In Strapi 5 we should use documentId for relations if possible
        const prodId = item.documentId || item.id;
        strapi.log.info(`Linking product: ${prodId} to order item`);

        await strapi.entityService.create('api::order-item.order-item', {
          data: {
            productName: item.name,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            total: item.total,
            selectedSize: item.selectedSize ? String(item.selectedSize) : null,
            selectedColor: item.selectedColor ? String(item.selectedColor) : null,
            product: prodId,
            order: order.id,
          }
        });
        const variantInfo = (item.selectedSize || item.selectedColor) 
          ? ` (${item.selectedSize ? 'Taille: ' + item.selectedSize : ''}${item.selectedSize && item.selectedColor ? ', ' : ''}${item.selectedColor ? 'Couleur: ' + item.selectedColor : ''})` 
          : '';
        itemsListHtml += `<li><strong>${item.name}</strong>${variantInfo}<br/>Quantité: ${item.quantity} - Total: ${item.total} TND</li>`;
      }

      // 5. Increment Coupon Usage
      if (validatedCart.coupon) {
        const coupon = await strapi.entityService.findOne('api::coupon.coupon', validatedCart.coupon.id);
        await strapi.entityService.update('api::coupon.coupon', coupon.id, {
          data: { timesUsed: coupon.timesUsed + 1 }
        });
      }

      // 6. Send Emails
      const adminEmail = process.env.SMTP_USERNAME || 'oussama21072000@gmail.com';
      
      try {
        // To Customer
        await strapi.plugins['email'].services.email.send({
          to: customerDetails.email,
          from: process.env.SMTP_FROM || 'no-reply@oussama-shoes.com',
          subject: `Confirmation de votre commande #${order.id} - Oussama Shoes`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
              <h1 style="color: #000; text-align: center; text-transform: uppercase;">Merci pour votre commande !</h1>
              <p>Bonjour ${customerDetails.firstName || ''},</p>
              <p>Nous avons bien reçu votre commande <strong>#${order.id}</strong>. Nous préparons votre colis avec soin.</p>
              <h3>Détails de la commande :</h3>
              <ul>${itemsListHtml}</ul>
              <p><strong>Total à payer à la livraison : ${order.total} TND</strong></p>
              <p>Adresse de livraison : ${customerDetails.address}</p>
              <br/>
              <p>À bientôt,<br/>L'équipe Oussama Shoes</p>
            </div>
          `,
        });

        // To Admin
        await strapi.plugins['email'].services.email.send({
          to: adminEmail,
          from: process.env.SMTP_FROM || 'no-reply@oussama-shoes.com',
          subject: `NOUVELLE COMMANDE #${order.id} - ${customerDetails.firstName} ${customerDetails.lastName}`,
          html: `
            <h2>Une nouvelle commande a été passée !</h2>
            <p><strong>Client :</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
            <p><strong>Téléphone :</strong> ${customerDetails.phone}</p>
            <p><strong>Email :</strong> ${customerDetails.email}</p>
            <p><strong>Adresse :</strong> ${customerDetails.address}</p>
            <hr/>
            <h3>Articles :</h3>
            <ul>${itemsListHtml}</ul>
            <p><strong>TOTAL : ${order.total} TND</strong></p>
          `,
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
        // We don't block the order if email fails, but we log it.
      }

      return {
        message: 'Order created successfully!',
        orderId: order.id,
        total: order.total
      };
    } catch (err) {
      console.error('Order creation failed:', err);
      return ctx.badRequest(err.message);
    }
  }
};
