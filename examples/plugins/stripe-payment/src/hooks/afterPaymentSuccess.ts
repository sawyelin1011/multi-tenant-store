import { HookHandler, PluginContext, PaymentHookData } from '@digital-commerce/plugin-sdk';

const handler: HookHandler<PaymentHookData> = async (context: PluginContext, data) => {
  context.logger.info('After payment success hook triggered', {
    paymentId: data.payment.id,
    amount: data.payment.amount,
    currency: data.payment.currency,
    orderId: data.order?.id,
  });

  // Send confirmation email
  if (data.order && data.order.customer_data?.email) {
    await context.events.emit('send_email', {
      to: data.order.customer_data.email,
      template: 'payment_confirmation',
      data: {
        orderNumber: data.order.order_number,
        amount: data.payment.amount,
        currency: data.payment.currency,
        paymentMethod: 'Stripe',
        transactionId: data.payment.transactionId,
      },
    });
  }

  // Update analytics
  await context.events.emit('track_event', {
    event: 'payment_completed',
    properties: {
      gateway: 'stripe',
      amount: data.payment.amount,
      currency: data.payment.currency,
      orderId: data.order?.id,
    },
    userId: data.order?.customer_data?.id,
  });

  // Store payment in Stripe-specific table
  if (data.payment.transactionId) {
    await context.db.query(
      `INSERT INTO stripe_payments (
        tenant_id, order_id, stripe_payment_intent_id, amount, currency, 
        status, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        context.tenant.id,
        data.order?.id || null,
        data.payment.transactionId,
        data.payment.amount,
        data.payment.currency,
        'succeeded',
        JSON.stringify(data.payment.metadata || {}),
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  }

  context.logger.info('After payment success hook completed', {
    paymentId: data.payment.id,
    orderId: data.order?.id,
  });

  return data;
};

export default handler;