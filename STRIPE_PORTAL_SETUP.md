# Stripe Customer Portal Setup

To enable the full subscription management features (cancel, update payment methods, download invoices), you need to configure the Stripe Customer Portal.

## Steps:

1. **Log into your Stripe Dashboard**
   - Go to https://dashboard.stripe.com/

2. **Navigate to Customer Portal Settings**
   - Go to `Settings` → `Billing` → `Customer portal`
   - Or visit: https://dashboard.stripe.com/settings/billing/portal

3. **Configure Portal Settings**
   - **Business information**: Add your business name, contact email, etc.
   - **Link branding**: Upload your logo, customize colors
   - **Functionality**: Enable the features you want customers to access:
     - ✅ Update payment methods
     - ✅ Cancel subscriptions  
     - ✅ Download invoices
     - ✅ View billing history

4. **Save Configuration**
   - Click "Save" to activate the customer portal

5. **Test the Portal**
   - Once configured, the "Manage" button in your app will work
   - Users will be redirected to Stripe's secure portal

## Features Available After Setup:

- **Cancel Subscription**: Users can cancel immediately or at period end
- **Update Payment**: Change credit cards, billing address
- **Download Invoices**: PDF downloads of all past invoices  
- **Billing History**: Complete transaction history
- **Pause Subscription**: Temporarily pause billing (if enabled)

## Fallback Solution:

Until the portal is configured, users will see contact information to email you directly for subscription changes.

## Security:

The Customer Portal is fully managed by Stripe with bank-level security. Users authenticate through your app, then Stripe handles all subscription management securely. 