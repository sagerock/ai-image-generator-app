import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth } from '@/lib/firebase-admin';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLAN } from '@/lib/stripe';

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

    const { type, packageId } = await request.json();

    if (!type || (type !== 'subscription' && type !== 'credits')) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    let sessionParams: any = {
      customer_email: userEmail,
      metadata: {
        userId,
        type,
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/canceled`,
    };

    if (type === 'subscription') {
      // Create subscription checkout
      sessionParams = {
        ...sessionParams,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: SUBSCRIPTION_PLAN.name,
                description: SUBSCRIPTION_PLAN.description,
              },
              unit_amount: SUBSCRIPTION_PLAN.price * 100, // Convert to cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          ...sessionParams.metadata,
          credits: SUBSCRIPTION_PLAN.credits,
        },
      };
    } else {
      // Create one-time credit purchase
      const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!creditPackage) {
        return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 });
      }

      sessionParams = {
        ...sessionParams,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: creditPackage.name,
                description: creditPackage.description,
              },
              unit_amount: creditPackage.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          ...sessionParams.metadata,
          credits: creditPackage.credits,
          packageId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 