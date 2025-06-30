import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, createUserProfile } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, action } = await request.json();

    // Verify the user is authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (action === 'create-profile') {
      // Create user profile with initial credits
      const userProfile = await createUserProfile(userId || decodedToken.uid, email || decodedToken.email);
      return NextResponse.json({ 
        success: true, 
        userProfile,
        message: 'User profile created successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 