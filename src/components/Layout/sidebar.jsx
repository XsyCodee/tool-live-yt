// components/Sidebar.jsx
import React from 'react';
import {
  Home, CloudUpload, ListVideo, PlayCircle, BarChart, Settings,
  HelpCircle, LogOut
} from 'lucide-react';
import NavItem from './NavItem';

const Sidebar = ({ activeSection, setActiveSection, handleLogout }) => {
  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col rounded-r-lg shadow-lg">
      <div className="flex items-center mb-6 px-2">
        <PlayCircle className="text-purple-500 mr-3" size={30} />
        <h1 className="text-2xl font-bold text-gray-50">StreamFlow</h1>
      </div>
      <nav className="flex-1">
        <NavItem icon={Home} label="Dashboard" section="dashboard" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={PlayCircle} label="Stream Aktif" section="active-streams" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={CloudUpload} label="Manajemen Konten" section="content-management" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={ListVideo} label="Playlist Saya" section="my-playlists" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={BarChart} label="Penggunaan & Tagihan" section="usage-billing" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={Settings} label="Pengaturan Akun" section="account-settings" activeSection={activeSection} setActiveSection={setActiveSection} />
        <NavItem icon={HelpCircle} label="Bantuan" section="help" activeSection={activeSection} setActiveSection={setActiveSection} />
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 mt-4 rounded-lg text-red-400 hover:bg-red-700 hover:text-white transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Keluar
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
