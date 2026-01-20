import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore, adminStorage, getAllUsers, getUserStats, updateUserCredits } from '@/lib/firebase-admin';

// Detect image format from magic bytes
function detectFormatFromBytes(buffer: Buffer): { mimeType: string; extension: string } | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  return null;
}

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
    const { action, userId, credits, dryRun } = body;

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

    if (action === 'migrate-images') {
      const isDryRun = dryRun !== false; // Default to dry run unless explicitly set to false
      console.log(`🔧 Admin ${admin.email} started image migration (dryRun: ${isDryRun})`);

      const bucket = adminStorage.bucket();
      const imagesSnapshot = await adminFirestore.collection('generated-images').get();

      let fixed = 0;
      let skipped = 0;
      let errors = 0;
      let alreadyCorrect = 0;
      const details: string[] = [];

      for (const doc of imagesSnapshot.docs) {
        const data = doc.data();
        const imageUrl = data.imageUrl as string;
        const fileName = data.fileName as string;

        if (!imageUrl || !fileName) {
          skipped++;
          continue;
        }

        // Extract path from URL
        const urlMatch = imageUrl.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
        if (!urlMatch) {
          skipped++;
          continue;
        }

        const filePath = urlMatch[1];
        const currentExt = fileName.split('.').pop()?.toLowerCase() || '';

        try {
          const file = bucket.file(filePath);
          const [exists] = await file.exists();

          if (!exists) {
            skipped++;
            continue;
          }

          const [buffer] = await file.download();
          const detected = detectFormatFromBytes(buffer);

          if (!detected) {
            skipped++;
            continue;
          }

          if (currentExt === detected.extension) {
            alreadyCorrect++;
            continue;
          }

          details.push(`${fileName} -> .${detected.extension}`);

          if (isDryRun) {
            fixed++;
            continue;
          }

          // Create new filename with correct extension
          const newFileName = fileName.replace(/\.[^.]+$/, '.' + detected.extension);
          const newFilePath = filePath.replace(fileName, newFileName);

          // Upload with correct format
          const newFile = bucket.file(newFilePath);
          await newFile.save(buffer, {
            metadata: { contentType: detected.mimeType },
          });
          await newFile.makePublic();

          // Get new public URL
          const newUrl = `https://storage.googleapis.com/${bucket.name}/${newFilePath}`;

          // Update Firestore document
          await adminFirestore.collection('generated-images').doc(doc.id).update({
            imageUrl: newUrl,
            fileName: newFileName,
          });

          // Delete old file
          await file.delete();

          fixed++;
        } catch (error) {
          console.error(`Error processing ${doc.id}:`, error);
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        dryRun: isDryRun,
        summary: {
          fixed,
          alreadyCorrect,
          skipped,
          errors,
          total: imagesSnapshot.size,
        },
        details: details.slice(0, 50), // Limit details to first 50
      });
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