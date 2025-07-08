// src/app/api/upload-r2/route.js
// API Route ini akan menangani upload file ke Cloudflare R2 secara aman dari sisi server.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from 'next/server';

// Inisialisasi S3Client untuk Cloudflare R2
// Kredensial diambil dari Environment Variables (AMAN, karena ini sisi server)
const R2 = new S3Client({
  region: "auto", // Gunakan "auto" untuk Cloudflare R2
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file'); // Dapatkan objek File dari FormData
    const userId = formData.get('userId'); // Dapatkan userId

    if (!file || !userId || !(file instanceof File)) { // Pastikan file adalah instance dari File
      return NextResponse.json({ success: false, message: 'File and userId are required and file must be valid.' }, { status: 400 });
    }

    // Konversi File menjadi Buffer (diperlukan oleh PutObjectCommand)
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    
    // Normalisasi nama file agar aman untuk path storage
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts.pop();
    const baseFileName = fileNameParts.join('.');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_');
    const finalFileName = fileExtension ? `${sanitizedFileName}.${fileExtension}` : sanitizedFileName;

    // Tentukan path di R2 (sesuai folder user)
    const filePath = `${userId}/${timestamp}_${finalFileName}`;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    // Perintah untuk mengunggah objek ke R2
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath, // Path lengkap file di dalam bucket
      Body: buffer, // Isi file
      ContentType: file.type || 'application/octet-stream', // Tipe MIME file
    });

    await R2.send(uploadCommand);

    // URL publik R2 (Anda perlu memastikan Public Access Domain diatur di dashboard R2 Anda)
    // Format URL R2 biasanya: https://<AccountID>.r2.cloudflarestorage.com/<BucketName>/<FilePath>
    // Atau bisa juga menggunakan Custom Domain yang Anda atur di Cloudflare.
    const publicUrl = `${process.env.CLOUDFLARE_R2_ENDPOINT_URL}/${bucketName}/${filePath}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded to R2 successfully',
      publicUrl: publicUrl,
      filePath: filePath, // Path di R2
      fileName: file.name, // Nama asli file
      fileSize: file.size, // Ukuran file
    }, { status: 200 });

  } catch (error) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json({ success: false, message: 'Failed to upload file to R2.', error: error.message }, { status: 500 });
  }
}