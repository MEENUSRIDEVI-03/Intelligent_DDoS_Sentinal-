import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { TrafficLog } from '../types';
import { Search, Filter, Download } from 'lucide-react';

export function TrafficPage() {
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchIp, setSearchIp] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getTrafficLogs(
          searchIp || undefined,
          severityFilter || undefined,
          100,
          0
        );
        setLogs(response.data.data);
      } catch (error) {
        console.error('Failed to load traffic logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [searchIp, severityFilter]);

  const handleDownloadCsv = () => {
    const csv = [
      ['Source IP', 'Destination IP', 'Port', 'Protocol', 'Packets', 'Bytes', 'Severity', 'Timestamp'],
      ...logs.map((log) => [
        log.sourceIp,
        log.destinationIp,
        log.port,
        log.protocol,
        log.packetCount,
        log.byteCount,
        log.severity,
        log.timestamp,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traffic_logs.csv';
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Traffic Logs
          </h1>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by IP..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Traffic Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              Loading traffic logs...
            </div>
          ) : logs.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Source IP
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Destination IP
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Protocol
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Packets
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Bytes
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                      {log.sourceIp}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {log.destinationIp}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.port}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.protocol}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.packetCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {(log.byteCount / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No traffic logs found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    high: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    critical: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        colors[severity as keyof typeof colors]
      }`}
    >
      {severity}
    </span>
  );
}
