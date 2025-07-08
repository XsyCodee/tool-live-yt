// src/lib/uploadFileToR2.ts
// Mengimplementasikan S3 Multipart Upload dari sisi klien ke Cloudflare R2

import { supabase } from './supabaseclient'; // Tetap untuk interaksi database

// Ukuran chunk default (5MB) - sesuaikan jika perlu
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadFileToR2 = async (file: File, userId: string) => {
  console.log('DEBUG: Inside uploadFileToR2 function (S3 Multipart Upload).');
  console.log('DEBUG: File object received:', file);
  console.log('DEBUG: User ID received:', userId);

  const fileSize = file.size;
  const fileName = file.name;
  const fileType = file.type || 'application/octet-stream';

  try {
    // --- Langkah 1: Memulai Multipart Upload (Meminta UploadId dari Backend) ---
    console.log('Initiating Multipart Upload via API...');
    const initiateResponse = await fetch('/api/r2-presign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'initiate',
        fileName: fileName,
        fileType: fileType,
        userId: userId,
      }),
    });
    const initiateData = await initiateResponse.json();

    if (!initiateResponse.ok || !initiateData.success) {
      throw new Error(initiateData.message || 'Failed to initiate multipart upload.');
    }

    const { uploadId, fileKey, publicUrl } = initiateData;
    console.log(`✅ Multipart Upload Initiated. UploadId: ${uploadId}, FileKey: ${fileKey}`);
    console.log(`Generated Public URL: ${publicUrl}`);

    // --- Langkah 2: Mengunggah Setiap Bagian (Chunk) File ---
    const chunkSize = DEFAULT_CHUNK_SIZE;
    const totalParts = Math.ceil(fileSize / chunkSize);
    const uploadedParts = [];

    console.log(`Starting upload of ${totalParts} parts (chunk size: ${chunkSize / (1024 * 1024)} MB)...`);

    for (let i = 0; i < totalParts; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);
      const part = file.slice(start, end);
      const partNumber = i + 1;

      // Meminta Presigned URL untuk bagian ini
      const signPartResponse = await fetch('/api/r2-presign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sign-part',
          fileKey: fileKey,
          uploadId: uploadId,
          partNumber: partNumber,
        }),
      });
      const signPartData = await signPartResponse.json();

      if (!signPartResponse.ok || !signPartData.success) {
        throw new Error(signPartData.message || `Failed to get presigned URL for part ${partNumber}.`);
      }

      const { presignedUrl } = signPartData;

      // Mengunggah bagian file langsung ke Presigned URL (R2)
      console.log(`⬆️ Uploading part ${partNumber}/${totalParts}...`);
      const uploadPartResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: part,
        headers: {
          'Content-Type': fileType,
        },
      });

      if (!uploadPartResponse.ok) {
        let errorBodyText = '';
        try {
            errorBodyText = await uploadPartResponse.text();
            console.error(`❌ Upload Part ${partNumber} Failed. Status: ${uploadPartResponse.status}, Text: ${uploadPartResponse.statusText}. Response: ${errorBodyText}`);
        } catch (e) {
            console.error(`❌ Could not read error body for part ${partNumber}:`, e);
        }
        throw new Error(`Failed to upload part ${partNumber}: ${uploadPartResponse.statusText}. Response: ${errorBodyText}`);
      }

      // Dapatkan ETag dari respons (penting untuk penyelesaian upload)
      const etag = uploadPartResponse.headers.get('ETag');
      if (!etag) {
        throw new Error(`ETag not found for part ${partNumber}.`);
      }
      uploadedParts.push({ PartNumber: partNumber, ETag: etag.replace(/"/g, '') }); // Hapus tanda kutip dari ETag

      const percentage = ((end / fileSize) * 100).toFixed(2);
      console.log(`✅ Part ${partNumber} uploaded. Progress: ${percentage}%`);
    }

    // --- Langkah 3: Menyelesaikan Multipart Upload ---
    console.log('Completing Multipart Upload...');
    const completeResponse = await fetch('/api/r2-presign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        fileKey: fileKey,
        uploadId: uploadId,
        parts: uploadedParts,
      }),
    });
    const completeData = await completeResponse.json();

    if (!completeResponse.ok || !completeData.success) {
      throw new Error(completeData.message || 'Failed to complete multipart upload.');
    }

    console.log('✅ Multipart Upload completed successfully!');

    // --- Langkah 4: Masukkan Metadata File ke Database (Supabase DB) ---
    console.log('Attempting to insert file metadata into DB...');
    const { data: dbInsertData, error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        name: fileName,
        size: fileSize,
        storage_path: fileKey, // Path di R2
        public_url: publicUrl, // URL publik
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ DB Insert Error:', dbError.message);
      console.error('Full dbError object:', dbError);
      // Rollback: Hapus file dari R2 jika insert DB gagal (perlu API Route lain untuk delete)
      console.warn('Manual rollback of R2 file might be needed if DB insert fails persistently.');
      return { error: dbError };
    }

    console.log('✅ File metadata inserted successfully:', dbInsertData);
    return { data: { ...dbInsertData, publicUrl } };

  } catch (error) {
    console.error("Error in uploadFileToR2 (Multipart Upload flow):", error.message);
    return { error: new Error(`Upload process failed: ${error.message}`) };
  }
};
