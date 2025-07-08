// src/app/api/r2-presign-upload/route.js
import { NextResponse } from 'next/server';
import { S3Client } from "@aws-sdk/client-s3";
import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Dapatkan variabel lingkungan R2
const CLOUDFLARE_R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const CLOUDFLARE_R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN; // Domain publik yang benar (misal: https://pub-xxx.r2.dev)
const CLOUDFLARE_R2_FILE_PREFIX = process.env.CLOUDFLARE_R2_FILE_PREFIX || ''; // Prefix folder di dalam bucket (misal: "stream-content/")

// Inisialisasi S3Client dengan endpoint yang benar untuk S3 API R2
// Endpoint ini adalah untuk KONTROL API S3 (upload, delete, manage), BUKAN domain publik file.
// Format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
const s3Client = new S3Client({
  region: "auto", // Gunakan "auto" untuk Cloudflare R2
  endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  const { action, fileName, fileType, uploadId, partNumber, parts, fileKey, userId } = await request.json();

  // Validasi variabel lingkungan yang krusial
  if (!CLOUDFLARE_R2_BUCKET_NAME || !CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_PUBLIC_DOMAIN) {
    console.error("R2 credentials missing or R2_PUBLIC_DOMAIN is not set in server config.");
    return NextResponse.json({ success: false, message: 'Server configuration error: R2 credentials or public domain are not set correctly.' }, { status: 500 });
  }

  try {
    // Key (path objek) di dalam bucket R2. Ini akan menyertakan prefix folder jika didefinisikan.
    const objectKey = `${CLOUDFLARE_R2_FILE_PREFIX}${userId}/${Date.now()}_${fileName}`;

    if (action === 'initiate') {
      const command = new CreateMultipartUploadCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME, // Ini adalah nama bucket Anda
        Key: objectKey,         // Ini adalah path objek lengkap di dalam bucket
        ContentType: fileType,
        ACL: 'public-read',     // Sangat Penting: Membuat objek bisa dibaca publik secara default
      });

      const { UploadId, Key: returnedKey } = await s3Client.send(command);

      // Bentuk public URL yang benar untuk akses publik
      // Format: R2_PUBLIC_DOMAIN / full_object_key (yang sudah termasuk prefix)
      const publicUrl = `${CLOUDFLARE_R2_PUBLIC_DOMAIN}/${returnedKey}`;

      return NextResponse.json({ success: true, uploadId: UploadId, fileKey: returnedKey, publicUrl });

    } else if (action === 'sign-part') {
      if (!uploadId || !partNumber || !fileKey) {
        return NextResponse.json({ success: false, message: 'Missing parameters for sign-part.' }, { status: 400 });
      }
      const command = new UploadPartCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileKey, // fileKey yang sudah diterima dari initiate (harus sudah termasuk prefix)
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      // Presigned URL berlaku selama 1 jam
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return NextResponse.json({ success: true, presignedUrl });

    } else if (action === 'complete') {
      if (!uploadId || !parts || !fileKey) {
        return NextResponse.json({ success: false, message: 'Missing parameters for complete.' }, { status: 400 });
      }
      const command = new CompleteMultipartUploadCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileKey, // fileKey yang sudah diterima dari initiate
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      const data = await s3Client.send(command);
      return NextResponse.json({ success: true, data });

    } else {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in R2 Multipart Upload API:", error); // Log error penuh untuk debugging
    // Berikan pesan error yang lebih spesifik jika memungkinkan
    let errorMessage = 'Failed to perform R2 operation.';
    if (error.code === 'EAI_AGAIN') {
      errorMessage = 'DNS resolution failed for R2 endpoint. Check server DNS or R2_ACCOUNT_ID in .env.local.';
    } else if (error.name === 'NoSuchBucket') {
      errorMessage = 'R2 Bucket not found. Check R2_BUCKET_NAME in .env.local.';
    } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      errorMessage = 'R2 Access Key or Secret Key is invalid. Check .env.local.';
    }
    return NextResponse.json({ success: false, message: errorMessage || error.message }, { status: 500 });
  }
}