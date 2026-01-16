import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DrainageMap = ({ drainageLocations = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Function to get marker color based on water level
  const getMarkerColor = (waterLevel) => {
    if (waterLevel >= 80) return '#ef4444'; // Red - Critical
    if (waterLevel >= 70) return '#f97316'; // Orange - High Alert
    if (waterLevel >= 50) return '#fbbf24'; // Yellow - Warning
    if (waterLevel >= 30) return '#3b82f6'; // Blue - Moderate
    return '#10b981'; // Green - Normal
  };

  // Function to get status text
  const getStatusText = (waterLevel) => {
    if (waterLevel >= 80) return 'Critical';
    if (waterLevel >= 70) return 'High Alert';
    if (waterLevel >= 50) return 'Warning';
    if (waterLevel >= 30) return 'Moderate';
    return 'Normal';
  };

  useEffect(() => {
    // Only initialize map once
    if (map.current) return;

    // Calculate center point from drainage locations
    let centerLat = 0;
    let centerLng = 0;

    if (drainageLocations.length > 0) {
      const sum = drainageLocations.reduce((acc, loc) => ({
        lat: acc.lat + loc.latitude,
        lng: acc.lng + loc.longitude
      }), { lat: 0, lng: 0 });

      centerLat = sum.lat / drainageLocations.length;
      centerLng = sum.lng / drainageLocations.length;
    } else {
      // Default to a reasonable location if no data
      centerLat = 43.6532; // Toronto
      centerLng = -79.3832;
    }

    // Initialize map with touch gestures enabled
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Free tile service
      center: [centerLng, centerLat],
      zoom: drainageLocations.length > 0 ? 12 : 10,
      // Enable touch gestures
      touchZoomRotate: true,
      touchPitch: true,
      cooperativeGestures: false, // Disable cooperative gestures for easier zooming
      doubleClickZoom: true,
      dragRotate: true,
      dragPan: true,
      keyboard: true,
      scrollZoom: true
    });

    // Add navigation controls (zoom buttons)
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true
    }), 'top-right');

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when drainage locations change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each drainage location
    drainageLocations.forEach((location) => {
      const color = getMarkerColor(location.water_level);
      const status = getStatusText(location.water_level);

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = color;
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';

      // Add pulse animation for critical levels
      if (location.water_level >= 70) {
        el.style.animation = 'pulse 2s infinite';
      }

      // Add icon
      const icon = document.createElement('i');
      icon.className = 'fas fa-tint';
      icon.style.color = 'white';
      icon.style.fontSize = '14px';
      el.appendChild(icon);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 35 }).setHTML(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #03045e; font-size: 16px; font-weight: bold;">
            ${location.sensor_id || location.name || 'Drainage Point'}
          </h3>
          <div style="color: #666; font-size: 14px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Water Level:</strong></span>
              <span style="color: ${color}; font-weight: bold;">${location.water_level} cm</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>Status:</strong></span>
              <span style="color: ${color}; font-weight: bold;">${status}</span>
            </div>
            ${location.area ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span><strong>Area:</strong></span>
                <span>${location.area}</span>
              </div>
            ` : ''}
            ${location.timestamp ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                ${new Date(location.timestamp).toLocaleString()}
              </div>
            ` : ''}
          </div>
        </div>
      `);

      // Create and add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are multiple locations
    if (drainageLocations.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      drainageLocations.forEach(loc => {
        bounds.extend([loc.longitude, loc.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else if (drainageLocations.length === 1) {
      map.current.flyTo({
        center: [drainageLocations[0].longitude, drainageLocations[0].latitude],
        zoom: 15,
        essential: true
      });
    }
  }, [drainageLocations]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 backdrop-blur-md rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <h4 className="text-xs font-bold text-flowra-900 mb-2">Status Legend</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">0-30cm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">30-50cm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-white shadow-sm"></div>
            <span className="text-gray-700">50-70cm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">70-80cm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
            <span className="text-gray-700">80+cm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrainageMap;
