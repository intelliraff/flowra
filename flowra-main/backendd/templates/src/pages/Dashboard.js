import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';

const Dashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_sensors: 0,
      total_readings: 0,
      total_alerts: 0,
      avg_water_level: 0,
      latest_reading: null,
      recent_readings_count: 0
    },
    sensors: [],
    readings: [],
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastStored, setLastStored] = useState(null);

  useEffect(() => {
    // Animate dashboard elements on load
    gsap.from('.dashboard-header', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    gsap.from('.tab-buttons', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      delay: 0.2,
      ease: 'power2.out'
    });

    gsap.from('.dashboard-content', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.4,
      ease: 'power2.out'
    });

    // Load initial data
    loadDashboardData();

    // Auto-refresh functionality
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        storeReading('V0'); // Auto-store V0 reading
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, sensorsRes, readingsRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/sensors'),
        fetch('/api/readings?limit=20'),
        fetch('/api/alerts?limit=10')
      ]);

      const statsData = await statsRes.json();
      const sensorsData = await sensorsRes.json();
      const readingsData = await readingsRes.json();
      const alertsData = await alertsRes.json();

      setDashboardData({
        stats: statsData.stats || dashboardData.stats,
        sensors: sensorsData.sensors || [],
        readings: readingsData.readings || [],
        alerts: alertsData.alerts || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeReading = async (pin = 'V0') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/store-reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: pin,
          sensor_id: `blynk_${pin}`
        })
      });

      const data = await response.json();

      if (data.success) {
        // Set last stored timestamp
        setLastStored(new Date().toLocaleTimeString());
        // Reload dashboard data to reflect new reading
        await loadDashboardData();
        return { success: true, message: `Data stored: ${data.data.sensor_value}` };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: 'Failed to store reading' };
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Blynk-Style Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Value Display Widget - Blynk Style */}
        <div className="blynk-widget bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl border border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-tachometer-alt text-white text-sm"></i>
              </div>
              <span className="text-blue-100 text-sm font-medium">VALUE DISPLAY</span>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {dashboardData.stats.avg_water_level || '--'}
          </div>
          <div className="text-blue-200 text-sm">Avg Water Level</div>
        </div>

        {/* SuperChart Widget */}
        <div className="blynk-widget bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl border border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <span className="text-purple-100 text-sm font-medium">SUPERCHART</span>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {dashboardData.stats.total_readings}
          </div>
          <div className="text-purple-200 text-sm">Total Readings</div>
        </div>

        {/* Notification Widget */}
        <div className="blynk-widget bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl border border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-bell text-white text-sm"></i>
              </div>
              <span className="text-red-100 text-sm font-medium">NOTIFICATION</span>
            </div>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              dashboardData.stats.total_alerts > 0 ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {dashboardData.stats.total_alerts}
          </div>
          <div className="text-red-200 text-sm">Active Alerts</div>
        </div>

        {/* Button Widget */}
        <div className="blynk-widget bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl border border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-play text-white text-sm"></i>
              </div>
              <span className="text-green-100 text-sm font-medium">BUTTON</span>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {dashboardData.stats.total_sensors}
          </div>
          <div className="text-green-200 text-sm">Active Sensors</div>
        </div>
      </div>

      {/* Latest Reading */}
      {dashboardData.stats.latest_reading && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 font-syne">Latest Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-flowra-200 text-sm">Sensor ID</div>
              <div className="text-flowra-100 font-semibold">{dashboardData.stats.latest_reading.sensor_id}</div>
            </div>
            <div>
              <div className="text-flowra-200 text-sm">Water Level</div>
              <div className="text-2xl font-bold text-flowra-300">{dashboardData.stats.latest_reading.water_level}</div>
            </div>
            <div>
              <div className="text-flowra-200 text-sm">Timestamp</div>
              <div className="text-flowra-100">{new Date(dashboardData.stats.latest_reading.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 font-syne">Quick Actions</h3>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-flowra-900 bg-opacity-30 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-flowra-500 bg-flowra-900 border-flowra-300 rounded focus:ring-flowra-500"
              />
              <span className="text-sm text-flowra-200">Auto-store V0 reading every 30 seconds</span>
            </label>
            {lastStored && (
              <span className="text-xs text-flowra-300 ml-auto">
                Last stored: {lastStored}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => storeReading('V0')}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Store V0 Reading
            </button>
            <button
              onClick={() => storeReading('V1')}
              disabled={isLoading}
              className="btn-outline flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Store V1 Reading
            </button>
            <button
              onClick={(e) => onNavigate('view-dashboard', e)}
              className="btn-primary flex items-center gap-2"
            >
              <i className="fas fa-desktop"></i>
              View Blynk Dashboard
            </button>
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="btn-outline flex items-center gap-2"
            >
              <i className="fas fa-refresh"></i>
              Refresh Data
            </button>
          </div>
        </div>
    </div>
  );

  const renderSensorsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-syne">Sensor Management</h3>
        <button
          onClick={loadDashboardData}
          className="btn-outline flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardData.sensors.map((sensor) => (
          <div key={sensor.sensor_id} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-flowra-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-microchip text-white"></i>
              </div>
              <div>
                <h4 className="font-semibold text-flowra-100">{sensor.sensor_id}</h4>
                <p className="text-flowra-200 text-sm">{sensor.area}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-flowra-200">Latitude:</span>
                <span className="text-flowra-100">{sensor.latitude}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-flowra-200">Longitude:</span>
                <span className="text-flowra-100">{sensor.longitude}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dashboardData.sensors.length === 0 && (
        <div className="glass-card p-12 text-center">
          <i className="fas fa-microchip text-6xl text-flowra-300 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No Sensors Found</h3>
          <p className="text-flowra-200">Register sensors to start monitoring water levels.</p>
        </div>
      )}
    </div>
  );

  const renderReadingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-syne">Recent Readings</h3>
        <button
          onClick={loadDashboardData}
          className="btn-outline flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-flowra-900 bg-opacity-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-flowra-200 uppercase tracking-wider">Sensor ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-flowra-200 uppercase tracking-wider">Water Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-flowra-200 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flowra-700 divide-opacity-30">
              {dashboardData.readings.map((reading) => (
                <tr key={reading.id} className="hover:bg-flowra-900 hover:bg-opacity-20">
                  <td className="px-6 py-4 whitespace-nowrap text-flowra-100">{reading.sensor_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${reading.water_level > 70 ? 'text-red-400' : 'text-flowra-300'}`}>
                      {reading.water_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-flowra-200 text-sm">
                    {new Date(reading.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dashboardData.readings.length === 0 && (
        <div className="glass-card p-12 text-center">
          <i className="fas fa-chart-line text-6xl text-flowra-300 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No Readings Found</h3>
          <p className="text-flowra-200">Sensor readings will appear here once data is collected.</p>
        </div>
      )}
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold font-syne">Alert History</h3>
        <button
          onClick={loadDashboardData}
          className="btn-outline flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {dashboardData.alerts.map((alert) => (
          <div key={alert.id} className="glass-card p-6 border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-white"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-red-300">High Water Level Alert</h4>
                  <p className="text-flowra-200 text-sm">Sensor: {alert.sensor_id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-red-400">{alert.water_level}</div>
                <div className="text-flowra-200 text-sm">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dashboardData.alerts.length === 0 && (
        <div className="glass-card p-12 text-center">
          <i className="fas fa-shield-alt text-6xl text-green-400 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No Alerts</h3>
          <p className="text-flowra-200">All systems are operating within normal parameters.</p>
        </div>
      )}
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'sensors':
        return renderSensorsTab();
      case 'readings':
        return renderReadingsTab();
      case 'alerts':
        return renderAlertsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="content-section">
      <div className="max-w-7xl mx-auto px-4">
        {/* Dashboard Header */}
        <div className="dashboard-header text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black font-syne mb-4 bg-gradient-to-r from-flowra-300 to-flowra-100 bg-clip-text text-transparent">
            Blynk Dashboard
          </h1>
          <p className="text-flowra-200 text-lg">
            Complete IoT monitoring system with real-time data visualization
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-buttons flex flex-wrap justify-center gap-4 mb-12">
          {[
            { id: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt' },
            { id: 'sensors', label: 'Sensors', icon: 'fas fa-microchip' },
            { id: 'readings', label: 'Readings', icon: 'fas fa-chart-line' },
            { id: 'alerts', label: 'Alerts', icon: 'fas fa-bell' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-flowra-500 text-white shadow-lg'
                  : 'bg-flowra-900 bg-opacity-50 text-flowra-200 hover:bg-flowra-800 hover:bg-opacity-50'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="fixed top-4 right-4 glass-card px-4 py-2 z-50">
            <div className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin text-flowra-300"></i>
              <span className="text-flowra-200">Loading...</span>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {renderCurrentTab()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
