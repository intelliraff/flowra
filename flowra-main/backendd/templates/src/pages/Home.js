import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const Home = ({ onNavigate }) => {
  useEffect(() => {
    // Animate elements on page load
    const tl = gsap.timeline();

    tl.from('.hero-title', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    })
    .from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4')
    .from('.hero-buttons', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3')
    .from('.stat-card', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.2');

    // Continuous pulse animation for seed circles
    gsap.to('.pulse-circle', {
      scale: 1.1,
      opacity: 0.8,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'power2.inOut',
      stagger: 0.2
    });
  }, []);

  return (
    <div className="content-section">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="hero-title text-6xl md:text-8xl font-black font-syne mb-6 bg-gradient-to-r from-flowra-300 to-flowra-100 bg-clip-text text-transparent">
            Flowra
          </h1>
          <p className="hero-subtitle text-xl md:text-2xl text-flowra-200 mb-12 font-light">
            Smart Drain Monitoring System
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={(e) => onNavigate('dashboard', e)}
              className="btn-primary text-lg px-10 py-4"
            >
              <i className="fas fa-tachometer-alt mr-2"></i>
              View Dashboard
            </button>
            <button
              onClick={(e) => onNavigate('sensors', e)}
              className="btn-outline text-lg px-10 py-4"
            >
              <i className="fas fa-microchip mr-2"></i>
              Monitor Sensors
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="stat-card">
            <div className="text-4xl font-bold text-flowra-300 mb-2">--</div>
            <div className="text-flowra-200">Active Sensors</div>
          </div>
          <div className="stat-card">
            <div className="text-4xl font-bold text-flowra-300 mb-2">--</div>
            <div className="text-flowra-200">Water Level</div>
          </div>
          <div className="stat-card">
            <div className="text-4xl font-bold text-flowra-300 mb-2">--</div>
            <div className="text-flowra-200">Alerts Today</div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 font-syne">
            Advanced Monitoring Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-flowra-500 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-circle">
                <i className="fas fa-water text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Monitoring</h3>
              <p className="text-flowra-200">Continuous water level monitoring with instant alerts</p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-flowra-500 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-circle">
                <i className="fas fa-chart-line text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Data Analytics</h3>
              <p className="text-flowra-200">Comprehensive reports and trend analysis</p>
            </div>
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 bg-flowra-500 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-circle">
                <i className="fas fa-bell text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Alerts</h3>
              <p className="text-flowra-200">Intelligent notifications for critical conditions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
