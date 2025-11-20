import { RouteHandler, PluginContext } from '@mtc-platform/plugin-sdk';
import crypto from 'crypto';

const handler: RouteHandler = async (context: PluginContext, req, res, next) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const config = context.plugin.config;

    context.logger.info('Processing Stripe webhook', {
      signature: signature?.substring(0, 20) + '...',
      bodyLength: body.length,
    });

    if (!signature) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No signature provided' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!config.webhook_secret) {
      throw new Error('Webhook secret not configured');
    }

    // Verify webhook signature
    const webhookSecret = config.webhook_secret;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const receivedSignature = signature.split(',').find(s => s.startsWith('t='))?.substring(2);
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature || '')
    )) {
      context.logger.warn('Invalid webhook signature', {
        expected: expectedSignature.substring(0, 20) + '...',
        received: receivedSignature?.substring(0, 20) + '...',
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid signature' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse webhook event
    const event = JSON.parse(body);

    context.logger.info('Stripe webhook event received', {
      type: event.type,
      id: event.id,
      created: event.created,
    });

    // Get plugin instance and handle webhook
    const stripePlugin = (context as any).stripePlugin;
    if (!stripePlugin) {
      throw new Error('Stripe plugin not initialized');
    }

    await stripePlugin.handleWebhook(context, event.type, event.data.object);

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    context.logger.error('Webhook processing failed', error instanceof Error ? error : new Error(String(error)));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Webhook processing failed' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export default handler;