import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
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
      const stripe = getServerStripe();
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

        // Only add credits for one-time purchases, not subscriptions
        // Subscriptions get credits via invoice.payment_succeeded to handle recurring payments
        if (type !== 'subscription') {
          // Update user credits for one-time purchases
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
        }

        // If it's a subscription, set up the subscription record (but don't add credits here)
        if (type === 'subscription' && session.subscription) {
          console.log(`📝 Creating subscription record for user ${userId}, subscription ${session.subscription}`);
          
          await adminFirestore.collection('subscriptions').add({
            userId,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Subscription created for user ${userId} - credits will be added via invoice`);
        } else if (type !== 'subscription') {
          console.log(`✅ One-time payment processed successfully for user ${userId}`);
        } else {
          console.log(`⚠️ Subscription checkout completed but no subscription ID found`);
        }
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
        
        console.log(`📧 Invoice payment succeeded for subscription: ${invoice.subscription}`);
        
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

            console.log(`👤 Adding credits for user: ${userId}`);

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

            console.log(`✅ Monthly credits added for subscription ${invoice.subscription}`);
          } else {
            console.error(`❌ No subscription record found for ${invoice.subscription}`);
            
            // Try to get customer info from Stripe and create subscription record
            try {
              const stripe = getServerStripe();
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              console.log(`🔍 Retrieved subscription from Stripe:`, subscription.id);
              
              // Look for user by customer ID in transactions
              const transactionsSnapshot = await adminFirestore
                .collection('transactions')
                .where('stripeCustomerId', '==', subscription.customer)
                .limit(1)
                .get();
              
              if (!transactionsSnapshot.empty) {
                const transaction = transactionsSnapshot.docs[0].data();
                const userId = transaction.userId;
                
                console.log(`🔄 Creating missing subscription record for user: ${userId}`);
                
                // Create the missing subscription record
                await adminFirestore.collection('subscriptions').add({
                  userId,
                  stripeSubscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer,
                  status: subscription.status,
                  currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                  currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  createdAt: FieldValue.serverTimestamp()
                });
                
                // Add the credits
                const userRef = adminFirestore.collection('users').doc(userId);
                await userRef.update({
                  credits: FieldValue.increment(400),
                  updatedAt: FieldValue.serverTimestamp()
                });
                
                console.log(`✅ Fixed missing subscription and added credits for ${userId}`);
              } else {
                console.error(`❌ Could not find user for customer ${subscription.customer}`);
              }
            } catch (error) {
              console.error(`❌ Error retrieving subscription:`, error);
            }
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