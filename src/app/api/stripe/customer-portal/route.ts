import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

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

    // Find user's Stripe customer ID from subscriptions first
    let customerId = null;
    
    const subscriptionsSnapshot = await adminFirestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!subscriptionsSnapshot.empty) {
      const subscription = subscriptionsSnapshot.docs[0].data();
      customerId = subscription.stripeCustomerId;
    }

    // If no subscription, try to find customer ID from transactions
    if (!customerId) {
      const transactionsSnapshot = await adminFirestore
        .collection('transactions')
        .where('userId', '==', userId)
        .where('stripeCustomerId', '!=', null)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!transactionsSnapshot.empty) {
        const transaction = transactionsSnapshot.docs[0].data();
        customerId = transaction.stripeCustomerId;
      }
    }

    if (!customerId) {
      console.log(`No customer ID found for user ${userId}`);
      return NextResponse.json({ 
        error: 'No payment history found. Please make a purchase first to access customer portal.' 
      }, { status: 404 });
    }

    const stripe = getServerStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    console.log(`Creating customer portal for customer: ${customerId}`);

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/account`,
    });

    console.log(`Customer portal session created: ${session.id}`);
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a Stripe configuration issue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('customer portal') || errorMessage.includes('billing portal')) {
      return NextResponse.json({
        error: 'Customer portal not configured. Please contact support to manage your subscription.',
        needsConfiguration: true
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: `Failed to create customer portal session: ${errorMessage}` },
      { status: 500 }
    );
  }
} 