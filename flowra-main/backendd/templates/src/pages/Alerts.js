import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const Alerts = () => {
  useEffect(() => {
    gsap.from('.page-content', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    });
  }, []);

  return (
    <div className="content-section">
      <div className="max-w-6xl mx-auto px-4 page-content">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-syne mb-4 text-flowra-100">
            Alert System
          </h1>
          <p className="text-flowra-200 text-lg mb-8">
            Configure alerts for water level thresholds and receive notifications
          </p>

          <div className="glass-card p-12 text-center">
            <i className="fas fa-exclamation-triangle text-6xl text-flowra-300 mb-6"></i>
            <h2 className="text-2xl font-semibold mb-4">Alert System Coming Soon</h2>
            <p className="text-flowra-200">
              Set up intelligent notifications and threshold-based alerts for critical conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
