/**
 * After Payment Failed Hook
 * Handles payment failure scenarios
 */

export default async function afterPaymentFailed(ctx: any, payment: any) {
  ctx.logger.warn(`Payment failed: ${payment.id}`, {
    error: payment.error_message,
    stripe_error_code: payment.stripe_error_code,
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
          stripe_error_code: payment.stripe_error_code,
          error_message: payment.error_message,
          failed_at: new Date().toISOString(),
        }),
        'payment_failed',
        payment.order_id,
      ]
    );

    // Send payment failure email to customer
    await ctx.email.send({
      to: payment.customer_email,
      template: 'payment_failed',
      data: {
        order: order,
        retry_url: `${ctx.store.domain}/checkout/${payment.order_id}`,
        error_message: payment.error_message,
        support_email: ctx.store.settings.support_email,
      },
    });

    // Send admin notification
    await ctx.email.send({
      to: ctx.store.settings.admin_email,
      template: 'payment_failed_admin',
      data: {
        order_id: payment.order_id,
        customer_email: payment.customer_email,
        amount: payment.amount,
        error: payment.error_message,
      },
    });

    // Emit event for other plugins
    await ctx.events.emit('stripe_payment_failed', {
      order_id: payment.order_id,
      amount: payment.amount,
      error: payment.error_message,
    });

    // Record in Stripe payments table
    await ctx.db.query(
      `INSERT INTO stripe_payments (tenant_id, order_id, stripe_payment_intent_id, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        ctx.tenantId,
        payment.order_id,
        payment.stripe_transaction_id || null,
        payment.amount,
        payment.currency,
        'failed',
        JSON.stringify({
          error_code: payment.stripe_error_code,
          error_message: payment.error_message,
          metadata: payment.gateway_metadata,
        }),
      ]
    );

    ctx.logger.info(`Payment failure recorded for order ${payment.order_id}`);
  } catch (error) {
    ctx.logger.error(`Error processing failed payment: ${error.message}`, {
      payment_id: payment.id,
      error: error,
    });
    throw error;
  }
}
