export interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export interface TrafficLog {
  id: string;
  sourceIp: string;
  destinationIp: string;
  port: number;
  protocol: string;
  packetCount: number;
  byteCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isBlocked: boolean;
}

export interface Prediction {
  id: string;
  prediction: 'normal' | 'suspicious' | 'high_risk' | 'ddos_attack';
  confidence: number;
  modelVersion: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  incidents: Incident[];
}

export interface Incident {
  id: string;
  alertId: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: 'traffic_summary' | 'security_analysis' | 'daily_report';
  data: Record<string, any>;
  createdAt: string;
}

export interface DashboardStats {
  totalRequests: number;
  requestsLastHour: number;
  suspiciousTraffic: number;
  activeAlerts: number;
  criticalAlerts: number;
  averageConfidence: number;
}
