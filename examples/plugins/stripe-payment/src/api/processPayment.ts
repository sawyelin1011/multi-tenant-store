import { RouteHandler, PluginContext } from '@digital-commerce/plugin-sdk';

const handler: RouteHandler = async (context: PluginContext, req, res, next) => {
  try {
    const { amount, currency, customerId, orderId, metadata } = await req.json();

    context.logger.info('Processing payment request', {
      amount,
      currency,
      customerId,
      orderId,
      tenantId: context.tenant.id,
    });

    // Validate input
    if (!amount || !currency) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Amount and currency are required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get plugin instance and process payment
    const stripePlugin = (context as any).stripePlugin;
    if (!stripePlugin) {
      throw new Error('Stripe plugin not initialized');
    }

    const result = await stripePlugin.processPayment(context, {
      amount,
      currency,
      customerId,
      orderId,
      metadata,
    });

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            transactionId: result.transactionId,
            status: result.status,
            redirectUrl: result.redirectUrl,
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    context.logger.error('Payment processing failed', error instanceof Error ? error : new Error(String(error)));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export default handler;