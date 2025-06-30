import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, createUserProfile } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify the user's authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user data
    const userRef = adminFirestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      await createUserProfile(userId, decodedToken.email || 'unknown@email.com');
      const newUserDoc = await userRef.get();
      const userData = newUserDoc.data();
      
      return NextResponse.json({
        credits: userData?.credits || 10,
        email: decodedToken.email,
        isNew: true
      });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      credits: userData?.credits || 0,
      email: decodedToken.email,
      isNew: false
    });

  } catch (error) {
    console.error('Error in user-info API:', error);
    return NextResponse.json({ 
      error: 'Failed to get user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 