import { PaymentPlugin, PluginContext } from '@digital-commerce/plugin-sdk';

export default class StripePaymentPlugin implements PaymentPlugin {
  name = 'Stripe Payment Gateway';
  version = '1.0.0';
  category = 'payment' as const;

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing Stripe Payment Gateway');
    
    // Validate configuration
    const config = context.plugin.config;
    if (!config.api_key || !config.webhook_secret) {
      throw new Error('Stripe API key and webhook secret are required');
    }

    // Initialize Stripe client
    const stripe = await import('stripe');
    const client = new stripe.default(config.api_key, {
      apiVersion: '2023-10-16',
    });

    // Store client in context for later use
    (context as any).stripe = client;

    context.logger.info('Stripe Payment Gateway initialized successfully');
  }

  async destroy(context: PluginContext): Promise<void> {
    context.logger.info('Destroying Stripe Payment Gateway');
    
    // Cleanup resources
    delete (context as any).stripe;
    
    context.logger.info('Stripe Payment Gateway destroyed');
  }

  async processPayment(context: PluginContext, paymentData: {
    amount: number;
    currency: string;
    customerId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    status: string;
    redirectUrl?: string;
    error?: string;
  }> {
    const stripe = (context as any).stripe;
    const config = context.plugin.config;

    try {
      context.logger.info('Processing Stripe payment', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
      });

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency.toLowerCase(),
        customer: paymentData.customerId,
        metadata: {
          order_id: paymentData.orderId,
          tenant_id: context.tenant.id,
          ...paymentData.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        confirmation_method: 'manual',
      });

      // Create payment session for redirect
      const session = await stripe.checkout.sessions.create({
        payment_intent: paymentIntent.id,
        mode: 'payment',
        success_url: config.success_url || `${process.env.PLATFORM_URL}/payment/success`,
        cancel_url: config.cancel_url || `${process.env.PLATFORM_URL}/payment/cancel`,
        metadata: {
          order_id: paymentData.orderId,
          tenant_id: context.tenant.id,
        },
      });

      // Cache payment intent for webhook processing
      await context.cache.set(
        `payment_intent:${paymentIntent.id}`,
        {
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          currency: paymentData.currency,
        },
        3600 // 1 hour
      );

      context.logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        sessionId: session.id,
        amount: paymentData.amount,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        redirectUrl: session.url,
      };

    } catch (error) {
      context.logger.error('Stripe payment processing failed', error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async capturePayment(context: PluginContext, transactionId: string): Promise<any> {
    const stripe = (context as any).stripe;

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      
      if (paymentIntent.status !== 'requires_capture') {
        throw new Error(`Payment intent cannot be captured: ${paymentIntent.status}`);
      }

      const capturedPayment = await stripe.paymentIntents.capture(transactionId);

      context.logger.info('Stripe payment captured', {
        paymentIntentId: transactionId,
        amount: capturedPayment.amount,
      });

      return capturedPayment;

    } catch (error) {
      context.logger.error('Stripe payment capture failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async refundPayment(context: PluginContext, transactionId: string, amount?: number): Promise<any> {
    const stripe = (context as any).stripe;

    try {
      const refundData: any = {
        payment_intent: transactionId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);

      context.logger.info('Stripe refund created', {
        refundId: refund.id,
        paymentIntentId: transactionId,
        amount: refund.amount,
      });

      return refund;

    } catch (error) {
      context.logger.error('Stripe refund failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getPaymentStatus(context: PluginContext, transactionId: string): Promise<any> {
    const stripe = (context as any).stripe;

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
      };

    } catch (error) {
      context.logger.error('Failed to get Stripe payment status', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async handleWebhook(context: PluginContext, event: string, data: any): Promise<void> {
    const config = context.plugin.config;
    const stripe = (context as any).stripe;

    try {
      // Verify webhook signature
      const signature = context.http.headers.get('stripe-signature');
      if (!signature) {
        throw new Error('No Stripe signature found');
      }

      const webhookSecret = config.webhook_secret;
      const body = JSON.stringify(data);
      
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      context.logger.info('Processing Stripe webhook', {
        type: event.type,
        id: event.id,
      });

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(context, event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(context, event.data.object);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(context, event.data.object);
          break;
        
        default:
          context.logger.info('Unhandled Stripe webhook event', { type: event.type });
      }

    } catch (error) {
      context.logger.error('Stripe webhook processing failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async handlePaymentSucceeded(context: PluginContext, paymentIntent: any): Promise<void> {
    // Get cached payment data
    const paymentData = await context.cache.get(`payment_intent:${paymentIntent.id}`);
    
    if (!paymentData) {
      context.logger.warn('No cached payment data found for payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    // Update order status
    if (paymentData.orderId) {
      await context.db.query(
        'UPDATE orders SET status = $1, payment_data = $2 WHERE id = $3 AND tenant_id = $4',
        ['completed', JSON.stringify({
          gateway: 'stripe',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status,
        }), paymentData.orderId, context.tenant.id]
      );
    }

    // Emit payment success event
    await context.events.emit('payment_success', {
      orderId: paymentData.orderId,
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    });

    // Clear cache
    await context.cache.delete(`payment_intent:${paymentIntent.id}`);

    context.logger.info('Payment succeeded', {
      paymentIntentId: paymentIntent.id,
      orderId: paymentData.orderId,
    });
  }

  private async handlePaymentFailed(context: PluginContext, paymentIntent: any): Promise<void> {
    const paymentData = await context.cache.get(`payment_intent:${paymentIntent.id}`);
    
    if (!paymentData) {
      context.logger.warn('No cached payment data found for payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    // Update order status
    if (paymentData.orderId) {
      await context.db.query(
        'UPDATE orders SET status = $1, payment_data = $2 WHERE id = $3 AND tenant_id = $4',
        ['payment_failed', JSON.stringify({
          gateway: 'stripe',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status,
          error: paymentIntent.last_payment_error?.message,
        }), paymentData.orderId, context.tenant.id]
      );
    }

    // Emit payment failure event
    await context.events.emit('payment_failure', {
      orderId: paymentData.orderId,
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      error: paymentIntent.last_payment_error?.message,
    });

    // Clear cache
    await context.cache.delete(`payment_intent:${paymentIntent.id}`);

    context.logger.info('Payment failed', {
      paymentIntentId: paymentIntent.id,
      orderId: paymentData.orderId,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  private async handlePaymentCanceled(context: PluginContext, paymentIntent: any): Promise<void> {
    const paymentData = await context.cache.get(`payment_intent:${paymentIntent.id}`);
    
    if (!paymentData) {
      context.logger.warn('No cached payment data found for payment intent', {
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    // Update order status
    if (paymentData.orderId) {
      await context.db.query(
        'UPDATE orders SET status = $1, payment_data = $2 WHERE id = $3 AND tenant_id = $4',
        ['cancelled', JSON.stringify({
          gateway: 'stripe',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status,
        }), paymentData.orderId, context.tenant.id]
      );
    }

    // Emit payment canceled event
    await context.events.emit('payment_canceled', {
      orderId: paymentData.orderId,
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    });

    // Clear cache
    await context.cache.delete(`payment_intent:${paymentIntent.id}`);

    context.logger.info('Payment canceled', {
      paymentIntentId: paymentIntent.id,
      orderId: paymentData.orderId,
    });
  }
}