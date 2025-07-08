import React from 'react';
import { Gauge, Clock, Zap, Wifi, Calendar, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const ActiveStreamsSection = ({ activeStreams }) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Daftar Stream Aktif & Dijadwalkan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeStreams.map(stream => (
          <div key={stream.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            stream.status === 'Aktif' ? 'border-green-500' :
            stream.status === 'Dijadwalkan' ? 'border-blue-500' :
            'border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg text-gray-800">{stream.name}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                stream.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                stream.status === 'Dijadwalkan' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {stream.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p className="flex items-center"><Gauge size={16} className="mr-2 text-gray-500" /> Resolusi: {stream.resolution}</p>
              <p className="flex items-center"><Clock size={16} className="mr-2 text-gray-500" /> Dimulai: {stream.startTime}</p>
              <p className="flex items-center"><Zap size={16} className="mr-2 text-gray-500" /> Durasi Aktif: {stream.duration}</p>
              <p className="flex items-center"><Wifi size={16} className="mr-2 text-gray-500" /> Bandwidth: {stream.bandwidthUsed}</p>
              {stream.error && <p className="flex items-center text-red-600"><AlertTriangle size={16} className="mr-2" /> Error: Stream terputus</p>}
            </div>
            <div className="mt-5 flex justify-between gap-3">
              <a href={stream.link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-purple-100 text-purple-600 hover:bg-purple-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center">
                <ExternalLink size={16} className="mr-2" /> Lihat
              </a>
              <button className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center">
                {stream.status === 'Aktif' ? 'Hentikan' : 'Kelola'}
              </button>
            </div>
          </div>
        ))}
        {activeStreams.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">Belum ada stream yang aktif atau dijadwalkan.</p>
        )}
      </div>
    </div>
  );
};

export default ActiveStreamsSection;
