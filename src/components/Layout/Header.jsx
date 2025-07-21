// components/Header.jsx
import React from 'react';
import { Bell } from 'lucide-react';

const Header = ({ activeSection, unreadNotificationsCount, setActiveSection }) => {
  return (
    <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 capitalize">
        {activeSection.replace('-', ' ')}
      </h2>
      <div className="relative">
        <Bell
          className="text-gray-600 cursor-pointer"
          size={24}
          onClick={() => setActiveSection('notifications')}
        />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadNotificationsCount}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
