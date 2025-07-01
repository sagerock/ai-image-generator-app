import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get subscription status from database
    const subscriptionsSnapshot = await adminFirestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    console.log(`🔍 Found ${subscriptionsSnapshot.size} subscription records for user ${userId}`);
    subscriptionsSnapshot.forEach(doc => {
      const d = doc.data();
      console.log(`  - ${d.stripeSubscriptionId} | status: ${d.status} | periodEnd: ${d.currentPeriodEnd}`);
    });

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ 
        hasSubscription: false,
        status: null,
        plan: null
      });
    }

    const subscription = subscriptionsSnapshot.docs[0].data();
    
    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      plan: {
        name: 'Monthly Credit Plan',
        amount: '$10/month',
        credits: '400 credits monthly'
      },
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canceledAt: subscription.canceledAt || null
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
} 