/**
 * Before Payment Process Hook
 * Validates payment data and prepares for Stripe processing
 */

export default async function beforePaymentProcess(ctx: any, payment: any) {
  const config = ctx.plugin.config;

  if (!config.enabled) {
    throw new Error('Stripe payment gateway is not enabled');
  }

  // Validate payment amount
  if (payment.amount < 0.50) {
    throw new Error('Minimum payment amount is $0.50');
  }

  if (payment.amount > 999999.99) {
    throw new Error('Maximum payment amount is $999,999.99');
  }

  // Validate currency
  const supportedCurrencies = ['usd', 'eur', 'gbp', 'jpy', 'aud', 'cad'];
  if (!supportedCurrencies.includes(payment.currency?.toLowerCase())) {
    throw new Error(`Unsupported currency: ${payment.currency}`);
  }

  // Validate customer email
  if (!payment.customer_email || !payment.customer_email.includes('@')) {
    throw new Error('Valid customer email is required');
  }

  // Add idempotency key for duplicate prevention
  payment.idempotency_key = `${payment.id}-${Date.now()}`;

  // Add gateway metadata
  payment.gateway_metadata = {
    gateway: 'stripe',
    test_mode: config.test_mode,
    webhook_url: `${ctx.store.domain}/api/${ctx.store.slug}/plugins/stripe-gateway/webhook`,
  };

  ctx.logger.info(`Preparing payment ${payment.id} for Stripe processing`, {
    amount: payment.amount,
    currency: payment.currency,
  });

  return payment;
}
