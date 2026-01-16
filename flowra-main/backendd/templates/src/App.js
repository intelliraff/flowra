import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ViewDashboard from './pages/ViewDashboard';
import Map from './pages/Map';
import Sensors from './pages/Sensors';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial load animation
    const tl = gsap.timeline();
    tl.to('body', {
      opacity: 0,
      duration: 0
    })
    .to('body', {
      opacity: 1,
      duration: 0.5,
      onComplete: () => setIsLoaded(true)
    });

    // Background animation
    gsap.to('.glow-arc.top', {
      y: -10,
      duration: 6,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1
    });

    gsap.to('.glow-arc.bottom', {
      y: 10,
      duration: 6,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      delay: -3
    });
  }, []);

  const navigateTo = (pageId, event) => {
    if (event) {
      event.preventDefault();
    }

    // Page transition animation
    const currentSection = document.querySelector('.content-section');
    if (currentSection) {
      gsap.to(currentSection, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        onComplete: () => {
          setCurrentPage(pageId);
          gsap.fromTo('.content-section',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        }
      });
    } else {
      setCurrentPage(pageId);
    }

    // Update URL hash
    if (pageId !== 'home') {
      window.location.hash = pageId;
    } else {
      window.history.replaceState(null, null, ' ');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={navigateTo} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'view-dashboard':
        return <ViewDashboard />;
      case 'map':
        return <Map />;
      case 'sensors':
        return <Sensors />;
      case 'alerts':
        return <Alerts />;
      case 'reports':
        return <Reports />;
      default:
        return <Home />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-flowra-900 flex items-center justify-center">
        <div className="text-flowra-100 text-xl">Loading Flowra...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="blur-background"></div>
      <div className="glow-arc top"></div>
      <div className="glow-arc bottom"></div>

      {/* Navigation */}
      <Navigation currentPage={currentPage} onNavigate={navigateTo} />

      {/* Main Content */}
      <main className="page-container">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
