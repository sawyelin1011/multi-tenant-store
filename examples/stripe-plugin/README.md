# Stripe Payment Gateway Plugin

Official Stripe payment gateway integration for the Digital Commerce Platform.

## Features

- **Payment Processing**: Accept payments via Stripe
- **Multiple Payment Methods**: Cards, Digital Wallets, Bank Transfers
- **Webhook Support**: Real-time payment status updates
- **Test & Live Modes**: Easy switching between test and live environments
- **Secure**: PCI compliant with Stripe infrastructure
- **Multi-Currency**: Support for 135+ currencies

## Installation

### 1. Upload Plugin

Upload this plugin to your platform or install via marketplace:

```bash
npm install @commerce/stripe-gateway
```

### 2. Get Stripe Credentials

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys
3. Create a webhook endpoint webhook signing secret

### 3. Configure Plugin

In your admin dashboard:

1. Go to Plugins → Stripe Payment Gateway
2. Enter your Stripe API credentials:
   - **Secret Key**: Your Stripe secret key (sk_test_...)
   - **Publishable Key**: Your Stripe publishable key (pk_test_...)
   - **Webhook Secret**: Your webhook signing secret
3. Enable the plugin
4. Choose Test or Live mode
5. Save settings

## Configuration

### Settings Schema

```json
{
  "api_key": {
    "type": "string",
    "label": "Stripe Secret Key",
    "required": true,
    "sensitive": true
  },
  "publishable_key": {
    "type": "string",
    "label": "Stripe Publishable Key",
    "required": true
  },
  "webhook_secret": {
    "type": "string",
    "label": "Webhook Signing Secret",
    "required": true,
    "sensitive": true
  },
  "test_mode": {
    "type": "boolean",
    "label": "Test Mode",
    "default": true
  }
}
```

## Usage

### Frontend Integration

Initialize Stripe on your storefront:

```javascript
const stripe = Stripe(publishableKey);

// Create payment intent
const response = await fetch('/api/{tenant}/plugins/stripe-gateway/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 29.99,
    currency: 'usd',
    customer_email: 'customer@example.com',
    description: 'Game Key Purchase',
    metadata: { order_id: '123' }
  })
});

const { client_secret } = await response.json();

// Mount Stripe elements
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Confirm payment
const result = await stripe.confirmCardPayment(client_secret, {
  payment_method: {
    card: cardElement,
    billing_details: { email: 'customer@example.com' }
  }
});

if (result.paymentIntent.status === 'succeeded') {
  console.log('Payment successful!');
}
```

### API Endpoint

Process a payment via API:

```bash
curl -X POST http://localhost:3000/api/my-store/plugins/stripe-gateway/process-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "amount": 29.99,
    "currency": "usd",
    "customer_email": "customer@example.com",
    "description": "Product Purchase",
    "metadata": {
      "order_id": "ord_123",
      "product_id": "prod_456"
    }
  }'
```

## Webhooks

The plugin automatically handles these Stripe webhooks:

- `payment_intent.succeeded`: Payment completed
- `payment_intent.payment_failed`: Payment failed
- `charge.refunded`: Refund processed
- `charge.dispute.created`: Dispute filed

Configure webhook in Stripe Dashboard:

1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/{tenant}/plugins/stripe-gateway/webhook`
3. Select events to listen to
4. Copy the signing secret to plugin settings

## Testing

### Test Cards

Use these test card numbers for testing:

| Card | Number | Expiry | CVC |
|------|--------|--------|-----|
| Visa (success) | 4242 4242 4242 4242 | 12/25 | 123 |
| Visa (decline) | 4000 0000 0000 0002 | 12/25 | 123 |
| Amex | 3782 822463 10005 | 12/25 | 1234 |
| Discover | 6011 1111 1111 1117 | 12/25 | 123 |

Any future expiry date and any 3-digit CVC work in test mode.

### Test Mode

When enabled, all payments use Stripe test environment:

- No real charges
- Instant processing
- Disposable test card numbers

## Database Schema

The plugin creates a `stripe_payments` table:

```sql
CREATE TABLE stripe_payments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(19, 4),
  currency VARCHAR(3),
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP
);
```

## Error Handling

Common Stripe errors:

| Error | Meaning | Solution |
|-------|---------|----------|
| card_declined | Card was declined | Customer should check card details |
| expired_card | Card has expired | Customer needs to use another card |
| incorrect_cvc | CVC is incorrect | Customer should verify CVC |
| processing_error | API error | Retry the payment |
| rate_limit | Too many requests | Implement exponential backoff |

## Troubleshooting

### "Invalid API Key"

- Verify API key is correct
- Ensure using secret key (sk_...), not publishable key
- Check test/live mode matches your keys

### "Webhook signature invalid"

- Verify webhook secret is correct
- Check webhook signing secret from Stripe dashboard
- Ensure webhook endpoint is public and accessible

### Payments not appearing

- Check webhook configuration
- Verify order ID is correctly passed
- Check plugin is enabled
- Review error logs

## Support

For support:

- Email: support@stripe.com
- Docs: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com

## License

MIT

## Changelog

### 1.0.0
- Initial release
- Payment intent creation
- Webhook support
- Test and live modes
