import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { Alert, Incident } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getAlerts(statusFilter || undefined, undefined, 100, 0);
        setAlerts(response.data.data);
      } catch (error) {
        console.error('Failed to load alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, [statusFilter]);

  const handleStatusUpdate = async (alertId: string, newStatus: string) => {
    try {
      await apiClient.updateAlert(alertId, newStatus);
      const response = await apiClient.getAlerts(statusFilter || undefined, undefined, 100, 0);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const handleCreateIncident = async (alertId: string) => {
    const description = prompt('Enter incident description:');
    if (!description) return;

    try {
      await apiClient.createIncident(alertId, description);
      const response = await apiClient.getAlerts(statusFilter || undefined, undefined, 100, 0);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Failed to create incident:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Alerts & Incidents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage security alerts
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Loading alerts...
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedAlert(expandedAlert === alert.id ? null : alert.id)
                  }
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          alert.status === 'resolved'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : alert.status === 'acknowledged'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {alert.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {expandedAlert === alert.id ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </button>

                {expandedAlert === alert.id && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Actions */}
                    <div className="flex gap-2">
                      {alert.status !== 'acknowledged' && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(alert.id, 'acknowledged')
                          }
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatusUpdate(alert.id, 'resolved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleCreateIncident(alert.id)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition text-sm"
                      >
                        Create Incident
                      </button>
                    </div>

                    {/* Incidents */}
                    {alert.incidents.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Related Incidents
                        </h4>
                        <div className="space-y-2">
                          {alert.incidents.map((incident) => (
                            <IncidentCard
                              key={incident.id}
                              incident={incident}
                              alertId={alert.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No alerts found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function IncidentCard({ incident, alertId }: { incident: Incident; alertId: string }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateIncident = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await apiClient.updateIncident(alertId, incident.id, {
        status: newStatus,
      });
      // Reload would happen in parent
    } catch (error) {
      console.error('Failed to update incident:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {incident.description}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Status: {incident.status} • Created: {new Date(incident.createdAt).toLocaleString()}
          </p>
          {incident.resolution && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Resolution: {incident.resolution}
            </p>
          )}
        </div>
        {incident.status !== 'resolved' && (
          <button
            onClick={() => handleUpdateIncident('resolved')}
            disabled={isUpdating}
            className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}
