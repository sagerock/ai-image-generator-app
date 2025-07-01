import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { adminAuth, adminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Locate active subscription for user
    const subSnap = await adminFirestore.collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subSnap.empty) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subDoc = subSnap.docs[0];
    const subData = subDoc.data();
    const stripeSubId = subData.stripeSubscriptionId as string;

    const stripe = getServerStripe();

    // Cancel at period end
    const updated = await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true
    });

    // Update Firestore status
    await subDoc.ref.update({
      status: updated.status,
      cancelAtPeriodEnd: true,
      cancelAt: (updated as any).cancel_at ? new Date((updated as any).cancel_at * 1000) : null,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Log transaction
    await adminFirestore.collection('transactions').add({
      userId,
      type: 'subscription_cancel',
      stripeSubscriptionId: stripeSubId,
      status: updated.status,
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, status: updated.status, ends: (updated as any).cancel_at || (updated as any).current_period_end });
  } catch (err) {
    console.error('Cancel subscription error', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
} 