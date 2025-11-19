/**
 * After Payment Success Hook
 * Handles post-payment operations after successful payment
 */

export default async function afterPaymentSuccess(ctx: any, payment: any) {
  ctx.logger.info(`Payment successful: ${payment.id}`, {
    amount: payment.amount,
    stripe_id: payment.stripe_transaction_id,
  });

  try {
    // Update order status
    const order = await ctx.db.query(
      `UPDATE orders 
       SET payment_data = payment_data || $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        JSON.stringify({
          stripe_id: payment.stripe_transaction_id,
          stripe_charge_id: payment.charge_id,
          paid_at: new Date().toISOString(),
        }),
        'confirmed',
        payment.order_id,
      ]
    );

    // Send payment confirmation email
    await ctx.email.send({
      to: payment.customer_email,
      template: 'payment_confirmed',
      data: {
        order: order,
        payment_amount: payment.amount,
        currency: payment.currency,
        transaction_id: payment.stripe_transaction_id,
      },
    });

    // Emit event for other plugins
    await ctx.events.emit('stripe_payment_success', {
      order_id: payment.order_id,
      amount: payment.amount,
      stripe_id: payment.stripe_transaction_id,
    });

    // Record in Stripe payments table
    await ctx.db.query(
      `INSERT INTO stripe_payments (tenant_id, order_id, stripe_payment_intent_id, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        ctx.tenantId,
        payment.order_id,
        payment.stripe_transaction_id,
        payment.amount,
        payment.currency,
        'succeeded',
        JSON.stringify(payment.gateway_metadata),
      ]
    );

    ctx.logger.info(`Order ${payment.order_id} confirmed and payment recorded`);
  } catch (error) {
    ctx.logger.error(`Error processing successful payment: ${error.message}`, {
      payment_id: payment.id,
      error: error,
    });
    throw error;
  }
}
