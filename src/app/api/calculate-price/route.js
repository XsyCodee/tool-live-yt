// src/app/api/calculate-price/route.js

import { NextResponse } from 'next/server';

export async function POST(request) {
  // Hanya izinkan permintaan POST
  if (request.method !== 'POST') {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
  }

  // Ambil body permintaan sebagai JSON
  const body = await request.json();

  // --- 1. Ambil input dari body permintaan ---
  const {
    fileSizeGB,         // Ukuran video dari user dalam GB (misal: 1.0, 0.5)
    resolution,         // Resolusi stream yang dipilih user (misal: "720p", "1080p")
    liveDurationHours,  // Total jam live yang diminta user (misal: 24, 720)
    originalResolution, // Resolusi asli video (misal: "360p", "720p"). Digunakan untuk logika warning/info.
  } = body;

  // --- 2. Validasi Input ---
  if (
    typeof fileSizeGB !== 'number' || fileSizeGB <= 0 ||
    typeof resolution !== 'string' || resolution.trim() === '' ||
    typeof liveDurationHours !== 'number' || liveDurationHours <= 0 ||
    typeof originalResolution !== 'string' || originalResolution.trim() === '' // Original resolution juga divalidasi
  ) {
    return NextResponse.json(
      { message: 'Invalid input. Please provide valid fileSizeGB (number > 0), resolution (string), liveDurationHours (number > 0), and originalResolution (string).' },
      { status: 400 }
    );
  }

  // --- 3. Parameter Harga Pokok Infrastruktur (TANPA MARGIN) ---
  // Sesuaikan nilai-nilai ini dengan biaya REAL Anda dari Cloudflare R2 dan Contabo VPS!
  const PRICE_PER_GB_STORAGE_MONTHLY_COST = 250; // Rp 250 per GB per bulan dari R2
  const PRICE_PER_GB_BANDWIDTH_COST = 1100;     // Rp 1.100 per GB dari VPS Egress ke YouTube

  // --- 4. Parameter Margin dan Biaya Aplikasi Tambahan ---
  const VENDOR_PROFIT_MARGIN_PERCENTAGE = 1.00; // 100% keuntungan vendor dari biaya operasional
  const APP_FEE_PERCENTAGE = 0.10;              // 10% biaya aplikasi dari harga final

  // --- 5. Mapping Bitrate berdasarkan Resolusi Stream yang Dipilih ---
  const BITRATE_MAP = {
    "360p": 0.8, // Mbps
    "480p": 1.2, // Mbps
    "720p": 3,   // Mbps
    "1080p": 6,  // Mbps
    "1440p": 10, // Mbps (2K)
    "2160p": 20, // Mbps (4K)
  };

  const bitrateMbps = BITRATE_MAP[resolution]; // Bitrate ditentukan dari RESOLUSI STREAM YANG DIPILIH

  if (!bitrateMbps) {
    return NextResponse.json(
      { message: `Unsupported stream resolution: ${resolution}. Supported resolutions: ${Object.keys(BITRATE_MAP).join(', ')}` },
      { status: 400 }
    );
  }

  // --- 6. Perhitungan Biaya Pokok Operasional ---

  // a. Biaya Pokok Penyimpanan (Storage Cost)
  // Diasumsikan minimal 1 bulan jika liveDurationHours > 0
  const rawStorageCost = fileSizeGB * PRICE_PER_GB_STORAGE_MONTHLY_COST;

  // b. Biaya Pokok Bandwidth (Bandwidth Cost)
  // Konversi bitrate Mbps ke MegaBytes per detik
  const MBps_at_bitrate = bitrateMbps / 8; // Hasil dalam MBps

  // Hitung total MegaBytes yang di-stream selama durasi live
  const totalMBBandwidthRaw = MBps_at_bitrate * liveDurationHours * 3600; // Total MB

  // Konversi total MB ke GigaBytes
  const totalGBBandwidthRaw = totalMBBandwidthRaw / 1024; // Total GB yang di-stream

  const rawBandwidthCost = totalGBBandwidthRaw * PRICE_PER_GB_BANDWIDTH_COST;

  // c. Total Biaya Pokok Operasional untuk stream ini
  const totalOperationalCost = rawStorageCost + rawBandwidthCost;

  // --- 7. Menambahkan Margin Profit Vendor dan Biaya Aplikasi ---
  const vendorProfit = totalOperationalCost * VENDOR_PROFIT_MARGIN_PERCENTAGE;
  const subtotalPrice = totalOperationalCost + vendorProfit;
  const finalPrice = subtotalPrice / (1 - APP_FEE_PERCENTAGE);

  // --- 8. Format Output untuk Tampilan ---
  const formatDataSize = (gbValue) => {
    if (gbValue === 0) return '0 Bytes';
    const bytesValue = gbValue * 1024 * 1024 * 1024; // Convert GB to Bytes

    if (bytesValue < 1024) { // Less than 1 KB
      return `${bytesValue.toFixed(0)} Bytes`;
    } else if (bytesValue < 1024 * 1024) { // Less than 1 MB
      return `${(bytesValue / 1024).toFixed(2)} KB`;
    } else if (bytesValue < 1024 * 1024 * 1024) { // Less than 1 GB
      return `${(bytesValue / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${gbValue.toFixed(3)} GB`;
  };

  // --- Logika Tambahan untuk Peringatan Upscaling/Downscaling ---
  let qualityWarning = '';
  // Anda perlu memastikan format 'originalResolution' (misal "360p") cocok dengan kunci di BITRATE_MAP
  const originalBitrate = BITRATE_MAP[originalResolution];

  if (originalBitrate && bitrateMbps > originalBitrate) {
    // Upscaling
    qualityWarning = `PERINGATAN: Resolusi asli video Anda adalah ${originalResolution}. Menaikkan ke ${resolution} dapat mengakibatkan kualitas gambar buram atau pixelated dan biaya bandwidth yang lebih tinggi untuk kualitas yang mungkin tidak optimal.`;
  } else if (originalBitrate && bitrateMbps < originalBitrate) {
    // Downscaling
    qualityWarning = `Anda akan stream dengan resolusi ${resolution}. Resolusi asli video Anda adalah ${originalResolution}, kualitas akan tetap baik dan menghemat data.`;
  } else if (originalBitrate && bitrateMbps === originalBitrate) {
    // Native Resolution
    qualityWarning = `Stream akan menggunakan resolusi asli video Anda (${resolution}). Kualitas optimal.`;
  } else {
    // Fallback jika originalResolution tidak dikenal
    qualityWarning = `Resolusi asli video (${originalResolution}) tidak dikenali untuk perbandingan kualitas.`;
  }


  return NextResponse.json({
    message: 'Price calculated successfully',
    details: {
      fileSizeGB_raw: parseFloat(fileSizeGB.toFixed(5)),
      fileSizeFormatted: formatDataSize(fileSizeGB),

      resolution,
      liveDurationHours,
      bitrateMbps,
      totalOperationalCost: parseFloat(totalOperationalCost.toFixed(2)),
      vendorProfit: parseFloat(vendorProfit.toFixed(2)),
      subtotalPrice: parseFloat(subtotalPrice.toFixed(2)),
      totalGBBandwidth_raw: parseFloat(totalGBBandwidthRaw.toFixed(5)), // Lebih presisi
      totalGBBandwidthFormatted: formatDataSize(totalGBBandwidthRaw),

      rawStorageCost: parseFloat(rawStorageCost.toFixed(2)),
      rawBandwidthCost: parseFloat(rawBandwidthCost.toFixed(2)),

      finalPrice: parseFloat(finalPrice.toFixed(2)),
      formattedPrice: `Rp ${finalPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      qualityWarning: qualityWarning // Tambahkan peringatan kualitas di sini
    },
  });
}