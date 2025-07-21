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
const CLOUDFLARE_R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
const CLOUDFLARE_R2_FILE_PREFIX = process.env.CLOUDFLARE_R2_FILE_PREFIX || '';

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  const { action, fileName, fileType, uploadId, partNumber, parts, fileKey, userId } = await request.json();

  if (!CLOUDFLARE_R2_BUCKET_NAME || !CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_PUBLIC_DOMAIN) {
    console.error("R2 credentials missing or CLOUDFLARE_R2_PUBLIC_DOMAIN is not set in server config.");
    return NextResponse.json({ success: false, message: 'Server configuration error: R2 credentials or public domain are not set correctly.' }, { status: 500 });
  }

  try {
    let objectKey = fileKey; // Gunakan fileKey yang sudah ada jika bukan 'initiate'

    if (action === 'initiate') {
      // --- Perbaikan Sanitasi Nama File (Hanya di sini!) ---
      const timestamp = Date.now();
      const originalFileName = fileName;

      const fileNameParts = originalFileName.split('.');
      const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
      const baseFileName = fileNameParts.join('.');

      const sanitizedBaseFileName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_{2,}/g, '_');
      const finalFileName = fileExtension ? `${sanitizedBaseFileName}.${fileExtension}` : sanitizedBaseFileName;

      // Bentuk objectKey hanya di sini
      objectKey = `${CLOUDFLARE_R2_FILE_PREFIX}${userId}/${timestamp}_${finalFileName}`;
      // --- Akhir Perbaikan Sanitasi Nama File ---

      const command = new CreateMultipartUploadCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: fileType,
        ACL: 'public-read',
      });

      const { UploadId, Key: returnedKey } = await s3Client.send(command);

      const publicUrl = `${CLOUDFLARE_R2_PUBLIC_DOMAIN}/${returnedKey}`;

      return NextResponse.json({ success: true, uploadId: UploadId, fileKey: returnedKey, publicUrl });

    } else if (action === 'sign-part') {
      if (!uploadId || !partNumber || !fileKey) {
        return NextResponse.json({ success: false, message: 'Missing parameters for sign-part.' }, { status: 400 });
      }
      const command = new UploadPartCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileKey, // fileKey sudah diterima dari initiate
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return NextResponse.json({ success: true, presignedUrl });

    } else if (action === 'complete') {
      if (!uploadId || !parts || !fileKey) {
        return NextResponse.json({ success: false, message: 'Missing parameters for complete.' }, { status: 400 });
      }
      const command = new CompleteMultipartUploadCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileKey, // fileKey sudah diterima dari initiate
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
    console.error("Error in R2 Multipart Upload API:", error);
    let errorMessage = 'Failed to perform R2 operation.';
    if (error.code === 'EAI_AGAIN') {
      errorMessage = 'DNS resolution failed for R2 endpoint. Check server DNS or CLOUDFLARE_R2_ACCOUNT_ID in .env.local.';
    } else if (error.name === 'NoSuchBucket') {
      errorMessage = 'R2 Bucket not found. Check CLOUDFLARE_R2_BUCKET_NAME in .env.local.';
    } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      errorMessage = 'R2 Access Key or Secret Key is invalid. Check .env.local.';
    }
    return NextResponse.json({ success: false, message: errorMessage || error.message }, { status: 500 });
  }
}
