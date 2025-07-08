import React from 'react';
import { Wifi, Clock, Download } from 'lucide-react';

const UsageBillingSection = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Penggunaan & Tagihan</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Penggunaan Bandwidth Bulan Ini</h4>
            <Wifi size={24} className="text-blue-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">4.2 TB</p>
          <p className="text-sm text-gray-600">dari 32 TB kuota</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '13.125%' }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Total Jam Streaming Bulan Ini</h4>
            <Clock size={24} className="text-purple-500" />
          </div>
          <p className="text-4xl font-bold text-gray-900">750 Jam</p>
          <p className="text-sm text-gray-600">dari 1000 Jam kuota (sisa 250 Jam)</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>

      <h4 className="text-lg font-bold text-gray-800 mb-4">Riwayat Tagihan</h4>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">2025-06-01</td>
              <td className="px-6 py-4 text-sm text-gray-500">Paket Pro Langganan</td>
              <td className="px-6 py-4 text-sm text-gray-500">€19.99</td>
              <td className="px-6 py-4 text-sm text-green-600">Berhasil</td>
              <td className="px-6 py-4 text-right">
                <button className="text-purple-600 hover:text-purple-900">
                  <Download size={18} />
                </button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">2025-05-01</td>
              <td className="px-6 py-4 text-sm text-gray-500">Paket Pro Langganan</td>
              <td className="px-6 py-4 text-sm text-gray-500">€19.99</td>
              <td className="px-6 py-4 text-sm text-green-600">Berhasil</td>
              <td className="px-6 py-4 text-right">
                <button className="text-purple-600 hover:text-purple-900">
                  <Download size={18} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsageBillingSection;
