import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';

const ViewDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_sensors: 0,
      total_readings: 0,
      total_alerts: 0,
      avg_water_level: 0,
      latest_reading: null
    },
    sensors: [],
    readings: [],
    alerts: []
  });
  const [latestReading, setLatestReading] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Blynk-style animations
    gsap.from('.blynk-header', {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('.blynk-widget', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.3,
      ease: 'power2.out'
    });

    // Load dashboard data
    loadDashboardData();
    fetchLatestReading();

    // Auto-refresh latest reading every 5 seconds
    const interval = setInterval(() => {
      fetchLatestReading();
    }, 5000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, sensorsRes, readingsRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/sensors'),
        fetch('/api/readings?limit=5'),
        fetch('/api/alerts?limit=5')
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
        await loadDashboardData(); // Refresh data
        await fetchLatestReading(); // Refresh latest reading
      }
    } catch (error) {
      console.error('Failed to store reading:', error);
    }
  };

  const fetchLatestReading = async () => {
    try {
      const response = await fetch('/api/latest');
      const data = await response.json();

      if (data.success && data.data) {
        setLatestReading(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch latest reading:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Blynk Header */}
      <header className="blynk-header bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-water text-white"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Flowra Water Monitoring</h1>
                <p className="text-sm text-gray-500">Smart Drain Monitoring System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Webhook: <code className="text-xs">/api/webhook/blynk</code>
              </div>
              <button
                onClick={() => {
                  loadDashboardData();
                  fetchLatestReading();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <i className="fas fa-sync-alt"></i>
                <span>Refresh All</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* Value Display Widget - Blynk Style */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-tachometer-alt text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value Display</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {latestReading?.water_level || dashboardData.stats.latest_reading?.water_level || '--'}
              </div>
              <div className="text-sm text-gray-500">Water Level</div>
              <div className="text-xs text-gray-400 mt-1">
                {latestReading?.sensor_id || dashboardData.stats.latest_reading?.sensor_id || 'No data'}
              </div>
              {latestReading && (
                <>
                  <div className="text-xs text-blue-500 mt-1 font-medium">
                    Live from webhook
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Updated: {new Date(latestReading.timestamp).toLocaleTimeString()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SuperChart Widget */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">SuperChart</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Readings</span>
                <span className="font-semibold text-gray-900">{dashboardData.stats.total_readings}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <div className="text-xs text-gray-400">Last 24 hours</div>
            </div>
          </div>

          {/* Button Widget */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-play text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Button</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => storeReading('V0')}
                disabled={isLoading}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                {isLoading ? 'Storing...' : 'Store V0 Reading'}
              </button>
              <button
                onClick={() => storeReading('V1')}
                disabled={isLoading}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {isLoading ? 'Storing...' : 'Store V1 Reading'}
              </button>
            </div>
          </div>

          {/* LED Widget (Alerts) */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  dashboardData.stats.total_alerts > 0 ? 'bg-red-500' : 'bg-gray-400'
                }`}>
                  <i className="fas fa-lightbulb text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">LED</span>
              </div>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                dashboardData.stats.total_alerts > 0 ? 'bg-red-400' : 'bg-green-400'
              }`}></div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                dashboardData.stats.total_alerts > 0 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {dashboardData.stats.total_alerts}
              </div>
              <div className="text-sm text-gray-500">Active Alerts</div>
              <div className="text-xs text-gray-400 mt-1">
                {dashboardData.stats.total_alerts > 0 ? 'Warning' : 'Normal'}
              </div>
            </div>
          </div>

          {/* Gauge Widget */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-gauge text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gauge</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="2"
                    strokeDasharray={`${(dashboardData.stats.avg_water_level / 100) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{dashboardData.stats.avg_water_level}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">Average Level</div>
            </div>
          </div>

          {/* Terminal Widget */}
          <div className="blynk-widget bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-terminal text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Terminal</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="bg-black rounded-lg p-3 font-mono text-xs text-green-400">
              <div>&gt; Connecting to Blynk...</div>
              <div>&gt; Sensor V0: {dashboardData.stats.latest_reading?.water_level || '--'}</div>
              <div>&gt; Status: Online</div>
              <div>&gt; Last sync: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Notification Widget */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bell text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notification</span>
              </div>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                dashboardData.alerts.length > 0 ? 'bg-red-400' : 'bg-green-400'
              }`}></div>
            </div>

            <div className="space-y-2">
              {dashboardData.alerts.slice(0, 3).map((alert, index) => (
                <div key={alert.id} className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                  <i className="fas fa-exclamation-triangle text-red-500 text-xs"></i>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-red-700 truncate">
                      Alert #{alert.id}
                    </div>
                    <div className="text-xs text-red-600">
                      Level: {alert.water_level}
                    </div>
                  </div>
                </div>
              ))}
              {dashboardData.alerts.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">No active alerts</div>
                </div>
              )}
            </div>
          </div>

          {/* GPS Stream Widget */}
          <div className="blynk-widget bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-white text-sm"></i>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">GPS Stream</span>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-map text-gray-400 text-xl"></i>
                </div>
                <div className="text-sm font-medium text-gray-900">{dashboardData.stats.total_sensors}</div>
                <div className="text-xs text-gray-500">Active Sensors</div>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Readings Table */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Readings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sensor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboardData.readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{reading.sensor_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{reading.water_level}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        reading.water_level > 70
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {reading.water_level > 70 ? 'High' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(reading.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewDashboard;
