import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const MyPlaylistsSection = ({ playlists, setShowNewStreamModal, setNewStreamStep }) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Playlist Saya</h3>

      <button
        onClick={() => { setShowNewStreamModal(true); setNewStreamStep(2); }}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md mb-6 flex items-center"
      >
        <Plus size={20} className="mr-2" /> Buat Playlist Baru
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map(playlist => (
          <div key={playlist.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">{playlist.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{playlist.items} item - {playlist.duration}</p>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center">
                <Edit size={16} className="mr-2" /> Edit
              </button>
              <button className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center">
                <Trash2 size={16} className="mr-2" /> Hapus
              </button>
            </div>
          </div>
        ))}
        {playlists.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">Belum ada playlist yang dibuat.</p>
        )}
      </div>
    </div>
  );
};

export default MyPlaylistsSection;
