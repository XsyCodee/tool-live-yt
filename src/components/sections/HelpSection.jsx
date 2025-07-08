import React from 'react';

const HelpSection = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Pusat Bantuan</h3>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h4 className="font-semibold text-lg text-gray-800 mb-4">Pertanyaan Umum (FAQ)</h4>
        <div className="space-y-4">
          <details className="border-b pb-2">
            <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">Bagaimana cara memulai stream 24/7?</summary>
            <p className="text-sm text-gray-600 mt-2">Anda bisa membuat playlist dan mengaktifkan opsi "Loop Playlist ini 24/7" saat membuat stream baru. Pastikan Anda memiliki kuota bandwidth yang cukup.</p>
          </details>
          <details className="border-b pb-2">
            <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">Apa yang terjadi jika stream saya terputus?</summary>
            <p className="text-sm text-gray-600 mt-2">Sistem kami akan mencoba untuk menyambungkan kembali stream secara otomatis. Anda juga akan menerima notifikasi jika stream terputus.</p>
          </details>
          <details className="border-b pb-2">
            <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">Bisakah saya mengubah kualitas stream saat live?</summary>
            <p className="text-sm text-gray-600 mt-2">Saat ini, perubahan kualitas stream (resolusi) tidak dapat dilakukan saat live. Anda perlu menghentikan dan memulai ulang stream dengan pengaturan yang baru.</p>
          </details>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Tidak menemukan jawaban? Jangan ragu untuk menghubungi kami!</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md">
            Hubungi Dukungan
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
