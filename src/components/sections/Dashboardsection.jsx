import React from 'react';
import { PlayCircle, Wifi, Youtube, ChevronRight, Plus, ListVideo, Zap, Calendar, XCircle, ExternalLink } from 'lucide-react';

const DashboardSection = ({ activeStreams, setShowNewStreamModal, setNewStreamStep, setActiveSection }) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Selamat Datang, YouTuber!</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Stream Aktif Saat Ini</p>
            <p className="text-3xl font-bold mt-1">{activeStreams.filter(s => s.status === 'Aktif').length}</p>
          </div>
          <PlayCircle size={48} className="opacity-50" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Bandwidth Bulan Ini</p>
            <p className="text-3xl font-bold mt-1 text-gray-800">4.2 TB</p>
            <p className="text-sm text-gray-500">dari 32 TB kuota</p>
          </div>
          <Wifi size={48} className="text-blue-500 opacity-60" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center justify-between border border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Akun YouTube Terhubung</p>
            <p className="text-3xl font-bold mt-1 text-gray-800">1</p>
            <p className="text-sm text-gray-500">Ganti Akun <ChevronRight size={14} className="inline-block" /></p>
          </div>
          <Youtube size={48} className="text-red-500 opacity-60" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => { setShowNewStreamModal(true); setNewStreamStep(1); }}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors flex items-center justify-center text-lg"
        >
          <Plus size={24} className="mr-3 relative z-50" /> Buat Stream Baru
        </button>
        <button
          onClick={() => setActiveSection('my-playlists')}
          className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors flex items-center justify-center text-lg"
        >
          <ListVideo size={24} className="mr-3" /> Kelola Playlist
        </button>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">Stream Terbaru</h3>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {activeStreams.slice(0, 3).map(stream => (
          <div key={stream.id} className="p-4 border-b last:border-b-0 border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              {stream.status === 'Aktif' && <Zap size={20} className="text-green-500 mr-3" />}
              {stream.status === 'Dijadwalkan' && <Calendar size={20} className="text-blue-500 mr-3" />}
              {stream.status === 'Error' && <XCircle size={20} className="text-red-500 mr-3" />}
              <div>
                <p className="font-semibold text-gray-800">{stream.name}</p>
                <p className="text-sm text-gray-500">{stream.resolution} - {stream.status} - {stream.duration}</p>
              </div>
            </div>
            <a href={stream.link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center text-sm">
              Lihat di YouTube <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
        ))}
        {activeStreams.length === 0 && (
          <p className="text-center text-gray-500 p-4">Belum ada stream yang aktif atau dijadwalkan.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardSection;
