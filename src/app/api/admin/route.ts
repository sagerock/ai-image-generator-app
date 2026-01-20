import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAllUsers, getUserStats, updateUserCredits } from '@/lib/firebase-admin';

// Simple admin check - you can make this more sophisticated
const ADMIN_EMAILS = [
  'admin@example.com',
  'sage@sagerock.com', // Your actual admin email
  // Add more admin emails as needed
];

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    if (!ADMIN_EMAILS.includes(decodedToken.email || '')) {
      return null;
    }
    
    return decodedToken;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🔑 Admin request from:', admin.email);

    // Get all users with their stats
    const users = await getAllUsers();
    
    // Get detailed stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          const stats = await getUserStats(user.id);
          
          return {
            id: user.id,
            email: user.email,
            credits: stats.credits,
            creditsUsed: stats.creditsUsed,
            imageCount: stats.imageCount,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          };
        } catch (error) {
          console.error(`Error getting stats for user ${user.id}:`, error);
          return {
            id: user.id,
            email: user.email,
            credits: 0,
            creditsUsed: 0,
            imageCount: 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            error: 'Failed to load stats'
          };
        }
      })
    );

    // Sort by creation date (newest first)
    usersWithStats.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      users: usersWithStats,
      totalUsers: usersWithStats.length,
      totalImages: usersWithStats.reduce((sum, user) => sum + user.imageCount, 0),
      totalCredits: usersWithStats.reduce((sum, user) => sum + user.credits, 0),
      totalCreditsUsed: usersWithStats.reduce((sum, user) => sum + user.creditsUsed, 0)
    });

  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch admin data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, credits } = body;

    if (action === 'update-credits') {
      if (!userId || typeof credits !== 'number') {
        return NextResponse.json({ error: 'User ID and credits are required' }, { status: 400 });
      }

      const success = await updateUserCredits(userId, credits);

      if (success) {
        console.log(`🔑 Admin ${admin.email} updated credits for user ${userId} to ${credits}`);
        return NextResponse.json({
          success: true,
          message: `Credits updated to ${credits}`
        });
      } else {
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in admin POST API:', error);
    return NextResponse.json({ 
      error: 'Failed to process admin request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 