import React from 'react';

const Navigation = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'view-dashboard', label: 'View Dashboard', icon: 'fas fa-desktop' },
    { id: 'map', label: 'Map', icon: 'fas fa-map' },
    { id: 'sensors', label: 'Sensors', icon: 'fas fa-microchip' },
    { id: 'alerts', label: 'Alerts', icon: 'fas fa-exclamation-triangle' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
  ];

  return (
    <nav className="nav-pill">
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={(e) => onNavigate('home', e)}
        title="Go to Home"
      >
        <div className="seed-of-life">
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
        </div>
        <span className="text-lg font-bold text-flowra-100 font-syne">Flowra</span>
      </div>

      <div className="flex gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={(e) => onNavigate(item.id, e)}
            className={`nav-item flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm ${
              currentPage === item.id
                ? 'text-white bg-flowra-600 shadow-lg border border-flowra-400'
                : 'text-white bg-flowra-800 hover:bg-flowra-700 border border-flowra-600'
            }`}
          >
            <i className={`${item.icon} text-sm`}></i>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
