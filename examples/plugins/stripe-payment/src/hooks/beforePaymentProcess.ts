import { HookHandler, PluginContext, PaymentHookData } from '@digital-commerce/plugin-sdk';

const handler: HookHandler<PaymentHookData> = async (context: PluginContext, data) => {
  context.logger.info('Before payment process hook triggered', {
    paymentId: data.payment.id,
    amount: data.payment.amount,
    currency: data.payment.currency,
  });

  // Add Stripe-specific metadata to payment
  data.payment.metadata = {
    ...data.payment.metadata,
    gateway: 'stripe',
    tenant_id: context.tenant.id,
    processed_at: new Date().toISOString(),
  };

  // Validate payment amount (minimum $0.50 for Stripe)
  if (data.payment.amount < 0.50) {
    throw new Error('Minimum payment amount is $0.50 for Stripe');
  }

  // Add idempotency key for Stripe
  data.payment.metadata.idempotency_key = `${data.payment.id}-${Date.now()}`;

  context.logger.info('Before payment process hook completed', {
    paymentId: data.payment.id,
    idempotencyKey: data.payment.metadata.idempotency_key,
  });

  return data.payment;
};

export default handler;