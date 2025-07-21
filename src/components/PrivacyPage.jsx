export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Kebijakan Privasi Aplikasi StreamFlow</h1>
      <p className="text-sm text-gray-500 mb-6">Terakhir Diperbarui: 16 Juli 2025</p>

      <section className="mb-8">
        <p>
          Kebijakan Privasi ini menjelaskan bagaimana aplikasi StreamFlow ("Kami", "Milik Kami", atau "Aplikasi")
          mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan layanan kami.
          Kami berkomitmen untuk melindungi privasi pengguna kami dan mematuhi undang-undang dan peraturan perlindungan data yang berlaku,
          termasuk persyaratan Google untuk aplikasi yang menggunakan Google API.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Informasi yang Kami Kumpulkan</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Informasi akun pengguna dari penyedia autentikasi seperti Supabase dan Google.</li>
          <li>Token akses dan refresh token dari Google untuk mengelola siaran langsung YouTube Anda.</li>
          <li>Metadata file video dari Cloudflare R2.</li>
          <li>Data penggunaan aplikasi dan interaksi dengan fitur aplikasi.</li>
          <li>Informasi teknis seperti alamat IP, browser, sistem operasi, dll.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
        <p>
          Untuk menyediakan layanan, autentikasi, peningkatan fitur, dukungan pelanggan, dan mematuhi hukum yang berlaku.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Penggunaan Data dari Google API</h2>
        <p>
          Kami hanya menggunakan data dari Google API sesuai dengan kebijakan Google API dan tidak akan membagikannya kepada pihak ketiga
          kecuali diwajibkan oleh hukum atau dibutuhkan untuk fitur tertentu.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Berbagi dan Pengungkapan Informasi</h2>
        <p>
          Kami tidak menjual informasi pribadi Anda. Kami hanya membagikannya dengan penyedia layanan pihak ketiga yang bekerja atas nama kami
          atau jika diwajibkan oleh hukum.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Keamanan Data</h2>
        <p>
          Kami menggunakan enkripsi dan kontrol akses untuk melindungi data Anda, namun tidak dapat menjamin keamanan absolut.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Retensi Data</h2>
        <p>
          Data disimpan selama diperlukan untuk menyediakan layanan kecuali diwajibkan lebih lama oleh hukum.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Hak-Hak Anda</h2>
        <p>
          Anda dapat meminta akses, koreksi, atau penghapusan informasi Anda dengan menghubungi kami.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Perubahan Kebijakan Privasi</h2>
        <p>
          Kami akan memberi tahu perubahan kebijakan dengan memperbarui halaman ini.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. Penafian dan Batasan Tanggung Jawab</h2>
        <p>
          Kami tidak bertanggung jawab atas kerusakan yang disebabkan oleh penggunaan aplikasi ini di luar kendali wajar kami.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">10. Hubungi Kami</h2>
        <p>
          Jika Anda memiliki pertanyaan, silakan hubungi kami di: <a href="mailto:you@example.com" className="text-blue-600 underline">you@example.com</a><br />
          atau kunjungi: <a href="https://andapresent.com/row/en/" target="_blank" className="text-blue-600 underline">https://andapresent.com/row/en/</a>
        </p>
      </section>
    </div>
  );
}

