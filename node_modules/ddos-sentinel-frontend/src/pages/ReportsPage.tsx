import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { Report } from '../types';
import { Download, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getReports(undefined, 100, 0);
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (type: 'traffic-summary' | 'security-analysis') => {
    setIsGenerating(true);
    try {
      if (type === 'traffic-summary') {
        await apiClient.generateTrafficSummaryReport();
      } else {
        await apiClient.generateSecurityAnalysisReport();
      }
      await loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const response = await apiClient.downloadReport(reportId);
      const json = JSON.stringify(response.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate and download security reports
          </p>
        </div>

        {/* Generate Report Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleGenerateReport('traffic-summary')}
            disabled={isGenerating}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-600 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Traffic Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate traffic analysis report
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleGenerateReport('security-analysis')}
            disabled={isGenerating}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border-l-4 border-red-600 disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-red-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Security Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate security report
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Reports
            </h2>
            <button
              onClick={loadReports}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Loading reports...
            </div>
          ) : reports.length > 0 ? (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {report.title}
                      </h3>
                      {report.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {report.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Type: {report.type} • Generated:{' '}
                        {new Date(report.createdAt).toLocaleString()}
                      </p>

                      {/* Report Data Preview */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                          View Data
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(report.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                    <button
                      onClick={() => handleDownload(report.id)}
                      className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition whitespace-nowrap"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No reports generated yet. Generate one to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
