import React from 'react';

const NavItem = ({ icon: Icon, label, section, activeSection, setActiveSection }) => (
  <button
    className={`flex items-center w-full px-3 py-2 my-1 rounded-lg transition-colors
      ${activeSection === section ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
    onClick={() => setActiveSection(section)}
  >
    <Icon size={20} className="mr-3" />
    <span>{label}</span>
  </button>
);

export default NavItem;
