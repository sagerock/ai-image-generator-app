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

    // Find user's Stripe customer ID from subscriptions
    const subscriptionsSnapshot = await adminFirestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscription = subscriptionsSnapshot.docs[0].data();
    const customerId = subscription.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID not found' }, { status: 404 });
    }

    const stripe = getServerStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
} 