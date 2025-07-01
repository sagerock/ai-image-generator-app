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
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscriptions found for this customer' 
      }, { status: 404 });
    }

    const subscription = subscriptions.data[0];
    console.log(`🎫 Found active subscription: ${subscription.id}`);

    // Check if subscription record exists in our database
    const subscriptionsSnapshot = await adminFirestore
      .collection('subscriptions')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();

    if (subscriptionsSnapshot.empty) {
      console.log(`📝 Creating missing subscription record`);
      
      // Create subscription record
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
    } else {
      console.log(`✅ Subscription record already exists`);
    }

    // Add 400 credits for the current subscription period
    const userRef = adminFirestore.collection('users').doc(userId);
    await userRef.update({
      credits: FieldValue.increment(400),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Record the transaction
    await adminFirestore.collection('transactions').add({
      userId,
      type: 'subscription_fix',
      amount: 10.00,
      credits: 400,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customer.id,
      status: 'completed',
      note: 'Manual subscription fix - added missing credits',
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`💳 Added 400 credits for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription fixed and credits added',
      subscriptionId: subscription.id,
      creditsAdded: 400,
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