import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { DashboardStats, Alert } from '../types';
import { Activity, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficTrend, setTrafficTrend] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [severityDist, setSeverityDist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, trendRes, alertsRes, severityRes] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getTrafficTrend(),
          apiClient.getRecentAlerts(),
          apiClient.getSeverityDistribution(),
        ]);

        setStats(statsRes.data);
        setTrafficTrend(trendRes.data);
        setRecentAlerts(alertsRes.data);
        setSeverityDist(severityRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const severityData = [
    { name: 'Critical', value: stats.criticalAlerts, color: '#dc2626' },
    { name: 'High', value: stats.suspiciousTraffic - stats.criticalAlerts, color: '#f97316' },
    { name: 'Medium', value: 0, color: '#eab308' },
    { name: 'Low', value: stats.totalRequests - stats.suspiciousTraffic, color: '#22c55e' },
  ];

  const handleSimulateTraffic = async () => {
    try {
      await apiClient.simulateTraffic(10);
      // Reload dashboard
      const statsRes = await apiClient.getDashboardStats();
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to simulate traffic:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time security monitoring and analytics
            </p>
          </div>
          <button
            onClick={handleSimulateTraffic}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            Simulate Traffic
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-8 h-8 text-blue-600" />}
            label="Total Requests"
            value={stats.totalRequests.toLocaleString()}
            subtext={`${stats.requestsLastHour} in last hour`}
          />
          <StatCard
            icon={<AlertTriangle className="w-8 h-8 text-yellow-600" />}
            label="Suspicious Traffic"
            value={stats.suspiciousTraffic.toLocaleString()}
            subtext={`${((stats.suspiciousTraffic / stats.totalRequests) * 100).toFixed(1)}% of total`}
          />
          <StatCard
            icon={<Activity className="w-8 h-8 text-red-600" />}
            label="Active Alerts"
            value={stats.activeAlerts.toLocaleString()}
            subtext={`${stats.criticalAlerts} critical`}
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            label="Avg Confidence"
            value={`${(stats.averageConfidence * 100).toFixed(1)}%`}
            subtext="ML Model confidence"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Traffic Trend (7 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Severity Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Alerts
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No alerts
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {subtext}
          </p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}
