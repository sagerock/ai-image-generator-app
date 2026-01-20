/**
 * Migration script to fix image format mismatches
 *
 * This script:
 * 1. Lists all images in Firebase Storage
 * 2. Detects their actual format using magic bytes
 * 3. If format doesn't match extension, re-uploads with correct extension/content-type
 * 4. Updates the Firestore documents with new URLs
 * 5. Deletes the old misnamed files
 *
 * Usage:
 *   npx tsx scripts/migrate-image-formats.ts
 *   npx tsx scripts/migrate-image-formats.ts --dry-run   # Preview changes without making them
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

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

async function main() {
  console.log('🚀 Starting image format migration...\n');

  // Validate environment variables
  if (!process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PRIVATE_KEY ||
      !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    console.error('❌ Missing required environment variables:');
    console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
    console.log('   FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
    console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
    console.log('   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅' : '❌');
    process.exit(1);
  }

  // Parse private key
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
  }

  // Initialize Firebase
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  const db = getFirestore(app);
  const storage = getStorage(app);
  const bucket = storage.bucket();

  console.log('✅ Firebase initialized\n');

  // Get all generated-images documents
  console.log('📋 Fetching image records from Firestore...');
  const imagesSnapshot = await db.collection('generated-images').get();
  console.log(`   Found ${imagesSnapshot.size} image records\n`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  let alreadyCorrect = 0;

  for (const doc of imagesSnapshot.docs) {
    const data = doc.data();
    const imageUrl = data.imageUrl as string;
    const fileName = data.fileName as string;

    if (!imageUrl || !fileName) {
      console.log(`⚠️  Skipping ${doc.id} - missing imageUrl or fileName`);
      skipped++;
      continue;
    }

    // Extract path from URL
    // URL format: https://storage.googleapis.com/bucket-name/images/userId/filename.ext
    const urlMatch = imageUrl.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
    if (!urlMatch) {
      console.log(`⚠️  Skipping ${doc.id} - can't parse URL: ${imageUrl}`);
      skipped++;
      continue;
    }

    const filePath = urlMatch[1];
    const currentExt = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      // Download the file
      const file = bucket.file(filePath);
      const [exists] = await file.exists();

      if (!exists) {
        console.log(`⚠️  Skipping ${doc.id} - file not found: ${filePath}`);
        skipped++;
        continue;
      }

      const [buffer] = await file.download();
      const detected = detectFormatFromBytes(buffer);

      if (!detected) {
        console.log(`⚠️  Skipping ${doc.id} - couldn't detect format`);
        skipped++;
        continue;
      }

      // Check if fix is needed
      if (currentExt === detected.extension) {
        // Already correct
        alreadyCorrect++;
        continue;
      }

      console.log(`🔧 ${doc.id}:`);
      console.log(`   Current: ${fileName} (${currentExt})`);
      console.log(`   Actual:  ${detected.mimeType} (.${detected.extension})`);

      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would fix: ${fileName} -> ${fileName.replace(/\.[^.]+$/, '.' + detected.extension)}`);
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
      await doc.ref.update({
        imageUrl: newUrl,
        fileName: newFileName,
      });

      // Delete old file
      await file.delete();

      console.log(`   ✅ Fixed: ${newFileName}`);
      fixed++;

    } catch (error) {
      console.error(`❌ Error processing ${doc.id}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ✓  Already correct: ${alreadyCorrect}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (DRY_RUN) {
    console.log('\n🔍 This was a dry run. Run without --dry-run to apply changes.');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
