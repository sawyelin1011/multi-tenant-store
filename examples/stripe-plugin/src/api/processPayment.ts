/**
 * Process Payment Endpoint
 * Creates a payment intent with Stripe
 */

import Stripe from 'stripe';

export default async function processPayment(
  ctx: any,
  req: any,
  res: any,
  next: any
) {
  try {
    const config = ctx.plugin.config;
    const { amount, currency, customer_email, description, metadata } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Amount and currency are required',
      });
    }

    // Initialize Stripe client
    const stripe = new Stripe(config.api_key, {
      apiVersion: '2023-10-16',
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customer_email,
      description: description,
      metadata: {
        order_id: metadata?.order_id,
        tenant_id: ctx.tenantId,
        ...metadata,
      },
      receipt_email: customer_email,
    });

    ctx.logger.info(`Payment intent created: ${paymentIntent.id}`, {
      amount,
      currency,
      customer_email,
    });

    res.status(201).json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    ctx.logger.error(`Payment processing error: ${error.message}`, {
      error,
      request_body: req.body,
    });

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    next(error);
  }
}
