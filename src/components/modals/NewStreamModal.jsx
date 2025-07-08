// src/components/Modals/NewStreamModal.jsx

import React, { useMemo, useState } from 'react';
import { CloudUpload } from 'lucide-react'; // Diperlukan untuk ikon CloudUpload

export default function NewStreamModal({
  showNewStreamModal,
  setShowNewStreamModal,
  newStreamStep,
  setNewStreamStep,
  selectedFiles,
  setSelectedFiles,
  playlistName,
  setPlaylistName,
  playlistItems,
  streamTitle,
  setStreamTitle,
  streamDescription,
  setStreamDescription,
  streamVisibility,
  setStreamVisibility,
  streamResolution,
  setStreamResolution,
  startNow, // Boolean: True if "Mulai Sekarang", False if "Jadwalkan untuk Nanti"
  setStartNow,
  scheduledDateTime,
  setScheduledDateTime,
  loopPlaylist,
  setLoopPlaylist,
  previewComponent,
  handleCreatePlaylist,
  handleStartStream,
  handleFileDrop, // <<< PENTING: Menerima prop handleFileDrop dari DashboardClient
  isUploadingFile, // <<< TERIMA PROP INI
}) {
  // State baru untuk durasi live dan hasil perhitungan harga
  const [liveDurationOption, setLiveDurationOption] = useState('1_day'); // '1_day', '3_days', '7_days', '30_days', 'custom'
  const [customLiveHours, setCustomLiveHours] = useState(1); // Jika custom dipilih
  const [calculatedPriceDetails, setCalculatedPriceDetails] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceCalculationError, setPriceCalculationError] = useState(null);

  if (!showNewStreamModal) return null;

  // --- Console.log untuk debugging ---
  console.log('--- NewStreamModal Render ---');
  console.log('Current newStreamStep:', newStreamStep);
  console.log('Current selectedFiles:', selectedFiles);
  console.log('Current selectedFiles.length:', selectedFiles.length);
  console.log('Current streamTitle:', streamTitle);
  console.log('Current streamDescription:', streamDescription);
  console.log('Current streamResolution:', streamResolution);
  console.log('Current liveDurationOption:', liveDurationOption);
  console.log('Current customLiveHours:', customLiveHours);
  console.log('Calculated Price:', calculatedPriceDetails);
  // --- Akhir console.log debugging ---

  // handleFileInputChange di sini adalah untuk input file di modal Langkah 1
  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    console.log('📤 Manual upload files (inside NewStreamModal - BEFORE handleFileDrop call):', files); // DEBUG LOG
    await setSelectedFiles(files); // Simpan files di state modal
    // Memanggil handleFileDrop yang diterima sebagai prop dari DashboardClient
    await handleFileDrop(files); // <<< PERUBAHAN KRUSIAL: Langsung kirim array 'files'
    console.log('DEBUG: ✅ handleFileDrop call completed (inside NewStreamModal).'); // DEBUG LOG
  };

  const getLiveHours = () => {
    switch (liveDurationOption) {
      case '1_day': return 24;
      case '3_days': return 3 * 24;
      case '7_days': return 7 * 24;
      case '30_days': return 30 * 24; // Perkiraan 1 bulan
      case 'custom': return customLiveHours;
      default: return 0;
    }
  };

  const handleCalculatePrice = async () => {
    if (selectedFiles.length === 0) {
      alert('Pilih file video terlebih dahulu.');
      return;
    }
    if (!streamTitle.trim()) {
      alert('Judul Stream tidak boleh kosong.');
      return;
    }

    setIsCalculatingPrice(true);
    setPriceCalculationError(null);
    setCalculatedPriceDetails(null);

    const firstFile = selectedFiles[0]; // Ambil file pertama untuk perhitungan
    const fileSizeGB = firstFile.size / (1024 * 1024 * 1024); // Konversi Bytes ke GB

    const totalLiveHours = getLiveHours();

    // Dapatkan resolusi asli video dari data file yang diunggah.
    // UNTUK TUJUAN TESTING SEMENTARA, kita akan gunakan nilai placeholder.
    // Nanti, nilai ini harus diambil dari metadata video yang sebenarnya (dari DB setelah FFprobe).
    const originalResolutionPlaceholder = "360p"; // <<< UBAH SESUAI RESOLUSI ASLI VIDEO TEST ANDA

    try {
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileSizeGB: fileSizeGB,
          resolution: streamResolution, // Resolusi stream yang dipilih user
          liveDurationHours: totalLiveHours,
          originalResolution: originalResolutionPlaceholder, // Kirim originalResolution ke API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCalculatedPriceDetails(data.details); // 'details' sudah termasuk formattedPrice
        console.log('Harga berhasil dihitung:', data.details);
      } else {
        setPriceCalculationError(data.message || 'Gagal menghitung harga.');
        console.error('Error menghitung harga:', data.message);
      }
    } catch (error) {
      setPriceCalculationError('Terjadi kesalahan jaringan saat menghitung harga.');
      console.error('Terjadi kesalahan jaringan saat menghitung harga:', error);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const isCalculatePriceButtonDisabled = useMemo(() => {
    return (
      newStreamStep !== 3 || // Hanya aktif di langkah 3
      selectedFiles.length === 0 || // Harus ada file
      !streamTitle.trim() || // Judul tidak boleh kosong
      (liveDurationOption === 'custom' && customLiveHours <= 0) || // Jika custom, jam harus > 0
      isCalculatingPrice ||
      isUploadingFile // <<< DISABLE SAAT UPLOAD
    );
  }, [newStreamStep, selectedFiles, streamTitle, liveDurationOption, customLiveHours, isCalculatingPrice, isUploadingFile]);

  const isStartStreamButtonDisabled = useMemo(() => {
    // Tombol "Mulai Stream Sekarang" hanya aktif jika harga sudah dihitung
    return !calculatedPriceDetails || isCalculatingPrice || isUploadingFile; // <<< DISABLE SAAT UPLOAD
  }, [calculatedPriceDetails, isCalculatingPrice, isUploadingFile]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max_w_2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Buat Stream Baru ({newStreamStep}/3)</h2>
          <button onClick={() => setShowNewStreamModal(false)} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        {/* Langkah 1: Pilih File */}
        {newStreamStep === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 1: Pilih File Video</h3>
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden" // Input tersembunyi
              id="fileInput" // ID untuk di-klik secara program
              onChange={handleFileInputChange} // Panggil handler ini
            />
            {/* Div yang bisa di-klik untuk memicu input file */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 bg-white hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => document.getElementById('fileInput').click()} // Memicu klik input tersembunyi
              // onDrop dan onDragOver/Enter di sini bukan untuk input file, tapi untuk drag-and-drop
              // di ContentManagementSection, jadi ini aman
              onDrop={handleFileDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <CloudUpload size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold mb-2">Drag and drop file di sini</p>
                <p className="text-gray-500 text-sm">atau klik untuk memilih file (MP4, MOV, MP3, JPG, PNG)</p>
                {isUploadingFile && ( // <<< TAMPILKAN LOADING SAAT UPLOAD
                  <p className="text-blue-500 font-semibold mt-2">Mengunggah file... Mohon tunggu.</p>
                )}
            </div>
            {previewComponent}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowNewStreamModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={() => setNewStreamStep(2)}
                disabled={selectedFiles.length === 0 || isUploadingFile} // <<< DISABLE SAAT UPLOAD
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploadingFile ? 'Mengunggah...' : 'Selanjutnya'}
              </button>
            </div>
          </div>
        )}

        {/* Langkah 2: Buat Playlist (opsional) */}
        {newStreamStep === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 2: Buat Playlist (Opsional)</h3>
            <input
              type="text"
              placeholder="Nama Playlist (Opsional)"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">File yang Dipilih:</h4>
                <ul className="list-disc list-inside">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600">{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setNewStreamStep(1)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Kembali
              </button>
              <button
                onClick={() => setNewStreamStep(3)}
                disabled={isUploadingFile} // <<< DISABLE SAAT UPLOAD
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Lewati & Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* Langkah 3: Detail Stream & Penjadwalan */}
        {newStreamStep === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Langkah 3: Detail Stream & Penjadwalan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Judul Stream</label>
                <input
                  type="text"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                  placeholder="Contoh: Live Streaming Konser"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deskripsi Stream</label>
                <textarea
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="Deskripsi singkat tentang stream Anda"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visibilitas</label>
                <select
                  value={streamVisibility}
                  onChange={(e) => setStreamVisibility(e.target.value)}
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  <option value="public">Publik</option>
                  <option value="private">Pribadi</option>
                  <option value="unlisted">Tidak Terdaftar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Resolusi Streaming</label>
                <select
                  value={streamResolution}
                  onChange={(e) => {
                    setStreamResolution(e.target.value);
                    setCalculatedPriceDetails(null); // Reset harga jika resolusi berubah
                  }}
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="720p">720p (HD)</option>
                  <option value="480p">480p (SD)</option>
                </select>
                <p className="text-xs text-gray-500">Tergantung paket Anda.</p>
              </div>
            </div>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Penjadwalan & Pengulangan</h4>
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="startNow"
                  name="scheduleOption"
                  checked={startNow}
                  onChange={() => setStartNow(true)}
                  className="mr-2"
                />
                <label htmlFor="startNow" className="text-sm text-gray-700">Mulai Sekarang</label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="scheduleLater"
                  name="scheduleOption"
                  checked={!startNow}
                  onChange={() => setStartNow(false)}
                  className="mr-2"
                />
                <label htmlFor="scheduleLater" className="text-sm text-gray-700">Jadwalkan untuk Nanti</label>
              </div>
              {!startNow && (
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="mt-2 block w-full p-2 border rounded-md"
                />
              )}
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="loopPlaylist"
                  checked={loopPlaylist}
                  onChange={(e) => setLoopPlaylist(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="loopPlaylist" className="text-sm text-gray-700">Ulangi Playlist ini 24/7 (Loop)</label>
              </div>

              {/* Input Durasi Live Baru */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Durasi Live</label>
                <select
                  value={liveDurationOption}
                  onChange={(e) => {
                    setLiveDurationOption(e.target.value);
                    setCalculatedPriceDetails(null); // Reset harga jika opsi berubah
                  }}
                  className="mt-1 block w-full p-2 border rounded-md"
                >
                  <option value="1_day">1 Hari (24 Jam)</option>
                  <option value="3_days">3 Hari (72 Jam)</option>
                  <option value="7_days">7 Hari (168 Jam)</option>
                  <option value="30_days">30 Hari (720 Jam)</option>
                  <option value="custom">Custom (Jam)</option>
                </select>
                {liveDurationOption === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    value={customLiveHours}
                    onChange={(e) => {
                      setCustomLiveHours(parseInt(e.target.value) || 0);
                      setCalculatedPriceDetails(null); // Reset harga jika custom jam berubah
                    }}
                    className="mt-2 block w-full p-2 border rounded-md"
                    placeholder="Masukkan durasi dalam jam"
                  />
                )}
              </div>
            </div>

            {/* Tombol Hitung Biaya */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCalculatePrice}
                disabled={isCalculatePriceButtonDisabled}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCalculatingPrice ? 'Menghitung...' : 'Hitung Biaya'}
              </button>
            </div>

            {/* Tampilan Hasil Perhitungan Harga */}
            {priceCalculationError && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
                Error: {priceCalculationError}
              </div>
            )}
            {calculatedPriceDetails && (
              <div className="mt-4 p-4 bg-green-50 text-green-800 rounded border border-green-200">
                <h4 className="font-semibold mb-2">Detail Perkiraan Biaya Stream:</h4>
                <p>Ukuran Video: {calculatedPriceDetails.fileSizeFormatted}</p>
                <p>Resolusi: {calculatedPriceDetails.resolution}</p>
                <p>Durasi Live: {calculatedPriceDetails.liveDurationHours} Jam</p>
                <p>Data Streaming: {calculatedPriceDetails.totalGBBandwidthFormatted}</p>
                <p className="text-lg font-bold mt-2">Total Biaya: {calculatedPriceDetails.formattedPrice}</p>
                <p className="text-sm text-gray-600 mt-1">*Harga ini belum termasuk biaya penyewaan infrastruktur dasar Anda.</p>
                {/* Tampilan Peringatan Kualitas */}
                {calculatedPriceDetails.qualityWarning && (
                  <p className="mt-2 text-sm font-semibold text-orange-600">
                    {calculatedPriceDetails.qualityWarning}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setNewStreamStep(2)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Kembali
              </button>
              <button
                onClick={handleStartStream} // Ini akan memicu fungsi di DashboardClient
                disabled={isStartStreamButtonDisabled}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Mulai Stream Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}