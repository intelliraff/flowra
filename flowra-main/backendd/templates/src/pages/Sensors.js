import React, { useState, useEffect } from 'react';

const Sensors = () => {
  const [sensorId, setSensorId] = useState('');
  const [sensorName, setSensorName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [area, setArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sensors, setSensors] = useState([]);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/sensors');
      const data = await response.json();
      setSensors(data.sensors || []);
    } catch (error) {
      console.error('Error fetching sensors:', error);
    } finally {
      setIsLoadingSensors(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validation
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!sensorId.trim()) {
      setMessage({ type: 'error', text: 'Sensor ID is required' });
      setIsSubmitting(false);
      return;
    }

    if (!sensorName.trim()) {
      setMessage({ type: 'error', text: 'Sensor Name is required' });
      setIsSubmitting(false);
      return;
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setMessage({ type: 'error', text: 'Latitude must be between -90 and 90' });
      setIsSubmitting(false);
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setMessage({ type: 'error', text: 'Longitude must be between -180 and 180' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/sensors/add-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor_id: sensorId.trim(),
          sensor_name: sensorName.trim(),
          latitude: lat,
          longitude: lng,
          area: area.trim() || 'Unknown Area'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Sensor location registered successfully!' });
        // Clear form
        setSensorId('');
        setSensorName('');
        setLatitude('');
        setLongitude('');
        setArea('');
        // Refresh sensor list
        fetchSensors();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to register sensor' });
      }
    } catch (error) {
      console.error('Error registering sensor:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-section" style={{ paddingTop: '100px' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-syne mb-4 text-flowra-100">
            <i className="fas fa-microchip mr-3"></i>
            Sensor Management
          </h1>
          <p className="text-flowra-200 text-lg mb-4">
            Register sensor locations for drainage monitoring
          </p>
        </div>

        {/* Sensor Registration Form */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-bold text-flowra-100 mb-6 flex items-center gap-2">
            <i className="fas fa-plus-circle text-flowra-400"></i>
            Register New Sensor Location
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message Display */}
            {message.text && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-500 bg-opacity-20 border-green-500 text-green-300'
                  : 'bg-red-500 bg-opacity-20 border-red-500 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sensor ID */}
              <div>
                <label className="block text-sm font-semibold text-flowra-200 mb-2">
                  <i className="fas fa-id-badge mr-2"></i>Sensor ID *
                </label>
                <input
                  type="text"
                  value={sensorId}
                  onChange={(e) => setSensorId(e.target.value)}
                  placeholder="e.g., blynk_V0"
                  className="w-full px-4 py-3 bg-flowra-800 text-white border-2 border-flowra-600 rounded-lg focus:outline-none focus:border-flowra-400 placeholder-flowra-400"
                  required
                />
              </div>

              {/* Sensor Name */}
              <div>
                <label className="block text-sm font-semibold text-flowra-200 mb-2">
                  <i className="fas fa-tag mr-2"></i>Sensor Name *
                </label>
                <input
                  type="text"
                  value={sensorName}
                  onChange={(e) => setSensorName(e.target.value)}
                  placeholder="e.g., Downtown Sensor"
                  className="w-full px-4 py-3 bg-flowra-800 text-white border-2 border-flowra-600 rounded-lg focus:outline-none focus:border-flowra-400 placeholder-flowra-400"
                  required
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-semibold text-flowra-200 mb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 43.6532"
                  className="w-full px-4 py-3 bg-flowra-800 text-white border-2 border-flowra-600 rounded-lg focus:outline-none focus:border-flowra-400 placeholder-flowra-400"
                  required
                />
                <p className="text-xs text-flowra-400 mt-1">Range: -90 to 90</p>
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-semibold text-flowra-200 mb-2">
                  <i className="fas fa-map-marker-alt mr-2"></i>Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -79.3832"
                  className="w-full px-4 py-3 bg-flowra-800 text-white border-2 border-flowra-600 rounded-lg focus:outline-none focus:border-flowra-400 placeholder-flowra-400"
                  required
                />
                <p className="text-xs text-flowra-400 mt-1">Range: -180 to 180</p>
              </div>

              {/* Area */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-flowra-200 mb-2">
                  <i className="fas fa-location-dot mr-2"></i>Area/Location
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., Downtown Toronto"
                  className="w-full px-4 py-3 bg-flowra-800 text-white border-2 border-flowra-600 rounded-lg focus:outline-none focus:border-flowra-400 placeholder-flowra-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-flowra-600 text-white font-bold rounded-lg hover:bg-flowra-500 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-flowra-400 shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Registering...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Register Sensor Location
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Registered Sensors List */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold text-flowra-100 mb-6 flex items-center gap-2">
            <i className="fas fa-list text-flowra-400"></i>
            Registered Sensors ({sensors.length})
          </h2>

          {isLoadingSensors ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-4xl text-flowra-400 mb-3"></i>
              <p className="text-flowra-200">Loading sensors...</p>
            </div>
          ) : sensors.length === 0 ? (
            <div className="text-center py-8 bg-flowra-900 bg-opacity-30 rounded-lg">
              <i className="fas fa-inbox text-6xl text-flowra-400 mb-3"></i>
              <p className="text-flowra-200 text-lg">No sensors registered yet</p>
              <p className="text-flowra-300 text-sm mt-2">Add your first sensor using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor, index) => (
                <div key={index} className="bg-flowra-900 bg-opacity-40 rounded-lg p-4 border border-flowra-700 hover:border-flowra-500 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{sensor.sensor_id}</h3>
                      <p className="text-sm text-flowra-300">{sensor.area || 'Unknown Area'}</p>
                    </div>
                    <i className="fas fa-microchip text-flowra-400 text-2xl"></i>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-flowra-200">
                      <i className="fas fa-map-marker-alt text-flowra-400"></i>
                      <span>Lat: {sensor.latitude?.toFixed(4) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-flowra-200">
                      <i className="fas fa-map-marker-alt text-flowra-400"></i>
                      <span>Lng: {sensor.longitude?.toFixed(4) || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-flowra-700">
                    <a
                      href={`#map`}
                      className="text-flowra-400 hover:text-flowra-300 text-sm font-semibold flex items-center gap-1"
                    >
                      <i className="fas fa-map"></i>
                      View on Map
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-flowra-300 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            Tip: Get coordinates from Google Maps by right-clicking on a location and selecting "What's here?"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sensors;
