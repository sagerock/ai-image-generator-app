import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('🎣 Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, type, credits } = session.metadata || {};

        if (!userId || !credits) {
          console.error('Missing metadata in session:', session.metadata);
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        const creditsToAdd = parseInt(credits);
        
        console.log(`💳 Processing payment for user ${userId}: ${creditsToAdd} credits`);

        // Update user credits
        const userRef = adminFirestore.collection('users').doc(userId);
        await userRef.update({
          credits: FieldValue.increment(creditsToAdd),
          updatedAt: FieldValue.serverTimestamp()
        });

        // Record the transaction
        await adminFirestore.collection('transactions').add({
          userId,
          type,
          amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
          credits: creditsToAdd,
          stripeSessionId: session.id,
          stripeCustomerId: session.customer,
          status: 'completed',
          createdAt: FieldValue.serverTimestamp()
        });

        // If it's a subscription, set up the subscription record
        if (type === 'subscription' && session.subscription) {
          await adminFirestore.collection('subscriptions').add({
            userId,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: FieldValue.serverTimestamp()
          });
        }

        console.log(`✅ Payment processed successfully for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Update subscription status in database
        const subscriptionsRef = adminFirestore.collection('subscriptions');
        const snapshot = await subscriptionsRef
          .where('stripeSubscriptionId', '==', subscription.id)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          await doc.ref.update({
            status: subscription.status,
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        console.log(`🔄 Subscription ${subscription.id} status updated to: ${subscription.status}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any; // Type assertion for subscription property
        
        // Handle recurring subscription payments
        if (invoice.subscription) {
          const subscriptionsRef = adminFirestore.collection('subscriptions');
          const snapshot = await subscriptionsRef
            .where('stripeSubscriptionId', '==', invoice.subscription)
            .get();

          if (!snapshot.empty) {
            const subscriptionDoc = snapshot.docs[0];
            const subscriptionData = subscriptionDoc.data();
            const userId = subscriptionData.userId;

            // Add monthly credits
            const userRef = adminFirestore.collection('users').doc(userId);
            await userRef.update({
              credits: FieldValue.increment(400), // Monthly subscription credits
              updatedAt: FieldValue.serverTimestamp()
            });

            // Record the transaction
            await adminFirestore.collection('transactions').add({
              userId,
              type: 'subscription',
              amount: invoice.amount_paid / 100, // Convert from cents
              credits: 400,
              stripeInvoiceId: invoice.id,
              stripeSubscriptionId: invoice.subscription,
              status: 'completed',
              createdAt: FieldValue.serverTimestamp()
            });

            console.log(`🔄 Monthly credits added for subscription ${invoice.subscription}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 