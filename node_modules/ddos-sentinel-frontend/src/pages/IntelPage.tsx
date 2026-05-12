import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiClient } from '../lib/api';
import { Globe, Radar, ShieldCheck, Loader2 } from 'lucide-react';

type QueryType = 'ip' | 'domain' | 'url';

type RiskLevel = 'Safe' | 'Suspicious' | 'Critical';

type IntelResponse = {
  threatScore: number;
  country: string;
  provider: string;
  requestRate: number;
  blacklistStatus: 'Not Blacklisted' | 'Blacklisted';
  mlClassification: 'normal' | 'suspicious' | 'high_risk' | 'ddos_attack';
  confidence: number;
  riskLevel: RiskLevel;
  summary: string;
};

function riskStyles(risk: RiskLevel) {
  switch (risk) {
    case 'Critical':
      return {
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
        dot: 'bg-red-600',
      };
    case 'Suspicious':
      return {
        badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    default:
      return {
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
        dot: 'bg-green-600',
      };
  }
}

export function IntelPage() {
  const [queryType, setQueryType] = useState<QueryType>('ip');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IntelResponse | null>(null);
  const [error, setError] = useState<string>('');

  const placeholder = useMemo(() => {
    if (queryType === 'ip') return 'e.g. 185.178.104.10';
    if (queryType === 'domain') return 'e.g. example.com';
    return 'e.g. https://example.com/login';
  }, [queryType]);

  const risk = result?.riskLevel;
  const styles = risk ? riskStyles(risk) : null;

  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    if (!value.trim()) {
      setError('Enter a value to analyze.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.analyzeIntel({ queryType, value });
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Intel analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Threat Intelligence Lookup</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Simulated reputation + ML-style classification to help SOC triage suspicious traffic.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Radar className="text-blue-600" size={18} />
            <span>Real-time ready (demo)</span>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value as QueryType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ip">IP Address</option>
                <option value="domain">Domain</option>
                <option value="url">URL</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">{error}</div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border">
                      {styles && <span className={`inline-block w-2 h-2 rounded-full ${styles.dot}`} />}
                      <span className={styles?.badge ? undefined : undefined}>{result.riskLevel}</span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">ML: {result.mlClassification}</span>
                  </div>
                  <p className="mt-3 text-gray-700 dark:text-gray-200">{result.summary}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Threat score</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{result.threatScore}/100</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Confidence: {(result.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard title="Country" value={result.country} />
                <InfoCard title="Provider / ISP" value={result.provider} />
                <InfoCard title="Request rate" value={`${result.requestRate.toFixed(2)} req/s`} />
                <InfoCard title="Blacklist status" value={result.blacklistStatus} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Triage Suggestions</h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                {result.riskLevel === 'Critical' ? (
                  <>
                    <li className="flex gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Escalate to incident response / containment workflow.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Block or rate-limit the source and monitor for rapid repeats.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Validate with deeper telemetry (flows, process, user/session).</span>
                    </li>
                  </>
                ) : result.riskLevel === 'Suspicious' ? (
                  <>
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Investigate patterns: timing, target ports, and session correlations.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Apply temporary throttling; watch for escalation.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Review related alerts and ML confidence trends.</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Monitor passively; no immediate action required.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Confirm legitimacy via allowlists / known-good sources.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Keep an eye on future anomalies.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

