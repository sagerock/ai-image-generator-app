import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { adminAuth, adminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    console.log(`🔧 Manual subscription fix requested for user: ${userId} (${userEmail})`);

    const stripe = getServerStripe();
    
    // Find active subscriptions for this customer email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 10
    });

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found for this email');
      return NextResponse.json({ 
        error: 'No Stripe customer found for this email',
        email: userEmail 
      }, { status: 404 });
    }

    const customer = customers.data[0];
    console.log(`👤 Found customer: ${customer.id}`);

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all' // get all statuses for debugging
    });
    console.log(`🔍 Stripe subscriptions found:`, subscriptions.data.map(s => ({id: s.id, status: s.status})));

    if (subscriptions.data.length === 0) {
      console.log('❌ No subscriptions found for this customer');
      return NextResponse.json({ 
        error: 'No subscriptions found for this customer' 
      }, { status: 404 });
    }

    // Prefer active, then trialing, then canceled
    const subscription = subscriptions.data.find(s => s.status === 'active') || subscriptions.data[0];
    console.log(`🎫 Using subscription: ${subscription.id} (status: ${subscription.status})`);

    // Check if subscription record exists in our database
    const subscriptionsSnapshot = await adminFirestore
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();
    console.log(`📦 Firestore subscription records found: ${subscriptionsSnapshot.size}`);

    let addedCredits = 0;
    if (subscriptionsSnapshot.empty) {
      console.log(`📝 Creating missing subscription record`);
      
      await adminFirestore.collection('subscriptions').add({
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        createdAt: FieldValue.serverTimestamp()
      });

      console.log(`✅ Subscription record created`);
      addedCredits = 400;
    } else {
      console.log(`✅ Subscription record already exists`);
    }

    if (addedCredits > 0) {
      // Add credits only if we created the subscription record
      const userRef = adminFirestore.collection('users').doc(userId);
      await userRef.update({
        credits: FieldValue.increment(addedCredits),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Record the transaction
      await adminFirestore.collection('transactions').add({
        userId,
        type: 'subscription_fix',
        amount: 10.00,
        credits: addedCredits,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: 'completed',
        note: 'Manual subscription fix - added missing credits',
        createdAt: FieldValue.serverTimestamp()
      });

      console.log(`💳 Added ${addedCredits} credits for user ${userId}`);
    } else {
      console.log('ℹ️ No credits added because subscription record already existed');
    }

    return NextResponse.json({
      success: true,
      message: addedCredits > 0 ? 'Subscription fixed and credits added' : 'Subscription record already exists – no credits added',
      subscriptionId: subscription.id,
      creditsAdded: addedCredits,
      subscriptionStatus: subscription.status
    });

  } catch (error) {
    console.error('Error fixing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fix subscription' },
      { status: 500 }
    );
  }
} 