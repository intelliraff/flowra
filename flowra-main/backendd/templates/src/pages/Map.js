import React, { useEffect, useState } from 'react';
import DrainageMap from '../components/DrainageMap';

const Map = () => {
  const [drainageLocations, setDrainageLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customLatitude, setCustomLatitude] = useState('');
  const [customLongitude, setCustomLongitude] = useState('');
  const [customLocation, setCustomLocation] = useState(null);

  useEffect(() => {
    // Fetch drainage locations
    fetchDrainageLocations();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDrainageLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDrainageLocations = async () => {
    try {
      const response = await fetch('/api/drainage-locations');
      const data = await response.json();

      if (data.success) {
        setDrainageLocations(data.locations || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load drainage locations');
      }
    } catch (err) {
      console.error('Error fetching drainage locations:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomLocation = () => {
    const lat = parseFloat(customLatitude);
    const lng = parseFloat(customLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    const newLocation = {
      sensor_id: 'custom',
      latitude: lat,
      longitude: lng,
      area: 'Custom Location',
      water_level: 0,
      timestamp: new Date().toISOString(),
      name: 'Custom Pin'
    };

    setCustomLocation(newLocation);
  };

  // Combine drainage locations with custom location if it exists
  const allLocations = customLocation
    ? [...drainageLocations, customLocation]
    : drainageLocations;

  return (
    <div className="content-section" style={{ paddingTop: '80px' }}>
      {/* Coordinate Input Bar - Fixed below header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-flowra-900 bg-opacity-95 backdrop-blur-md border-b border-flowra-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-flowra-400"></i>
              <span className="text-white font-semibold text-sm">Add Custom Location:</span>
            </div>
            <input
              type="number"
              placeholder="Latitude (e.g. 43.6532)"
              value={customLatitude}
              onChange={(e) => setCustomLatitude(e.target.value)}
              className="px-3 py-1.5 bg-flowra-800 text-white border border-flowra-600 rounded-lg text-sm focus:outline-none focus:border-flowra-400"
              style={{ width: '180px' }}
            />
            <input
              type="number"
              placeholder="Longitude (e.g. -79.3832)"
              value={customLongitude}
              onChange={(e) => setCustomLongitude(e.target.value)}
              className="px-3 py-1.5 bg-flowra-800 text-white border border-flowra-600 rounded-lg text-sm focus:outline-none focus:border-flowra-400"
              style={{ width: '180px' }}
            />
            <button
              onClick={handleAddCustomLocation}
              className="px-4 py-1.5 bg-flowra-600 text-white rounded-lg text-sm font-semibold hover:bg-flowra-500 border border-flowra-400"
            >
              <i className="fas fa-plus mr-1"></i> Add Pin
            </button>
            {customLocation && (
              <button
                onClick={() => setCustomLocation(null)}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-500"
              >
                <i className="fas fa-times mr-1"></i> Clear
              </button>
            )}
            <div className="flex items-center gap-3 ml-4">
              <div className="text-xs text-flowra-300">
                Locations: <span className="text-white font-bold">{allLocations.length}</span>
              </div>
              <button
                onClick={fetchDrainageLocations}
                disabled={isLoading}
                className="px-4 py-1.5 bg-flowra-800 text-white rounded-lg text-sm font-semibold hover:bg-flowra-700 border border-flowra-600"
              >
                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''} mr-1`}></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container - Full width below coordinate bar */}
      <div className="w-full" style={{ marginTop: '60px', height: 'calc(100vh - 140px)' }}>
        {error && (
          <div className="bg-red-900 bg-opacity-80 text-white px-6 py-3 text-center border-b border-red-700">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {isLoading && allLocations.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-flowra-900">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-6xl text-flowra-400 mb-4"></i>
              <p className="text-flowra-200 text-lg">Loading map...</p>
            </div>
          </div>
        ) : (
          <DrainageMap drainageLocations={allLocations} />
        )}
      </div>
    </div>
  );
};

export default Map;
