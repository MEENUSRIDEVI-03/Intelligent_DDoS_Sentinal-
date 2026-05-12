import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

type QueryType = 'ip' | 'domain' | 'url';

type RiskLevel = 'Safe' | 'Suspicious' | 'Critical';

type IntelResponse = {
  threatScore: number; // 0-100
  country: string;
  provider: string;
  requestRate: number; // requests/sec-ish
  blacklistStatus: 'Not Blacklisted' | 'Blacklisted';
  mlClassification: 'normal' | 'suspicious' | 'high_risk' | 'ddos_attack';
  confidence: number; // 0-1
  riskLevel: RiskLevel;
  summary: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashToNumber(input: string) {
  // Simple deterministic hash (non-crypto) just for stable simulated results.
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function makeDeterministicIntel(queryType: QueryType, value: string): IntelResponse {
  const normalized = value.trim().toLowerCase();
  const seed = hashToNumber(`${queryType}:${normalized}`);

  const countries = ['US', 'DE', 'IN', 'BR', 'NG', 'GB', 'RU', 'CN', 'FR', 'NL', 'CA', 'SG'];
  const providers = ['FastNet Transit', 'Apex ISP', 'Orion Hosting', 'CloudForge', 'NorthBridge Telecom', 'ByteWave'];

  const requestRate = clamp(((seed % 9000) / 100) + (queryType === 'ip' ? 5 : 2), 0.1, 500);
  const baseThreat = clamp((seed % 101) + (requestRate > 200 ? 25 : 0), 0, 100);

  // Add some heuristics for more believable mapping
  const suspiciousHints =
    normalized.includes('login') ||
    normalized.includes('admin') ||
    normalized.includes('ddos') ||
    normalized.includes('attack') ||
    normalized.includes('bot');

  const hasManyDigits = (normalized.match(/\d/g) || []).length >= 6;

  const threatScore = clamp(baseThreat + (suspiciousHints ? 15 : 0) + (hasManyDigits ? 8 : 0), 0, 100);

  let mlClassification: IntelResponse['mlClassification'] = 'normal';
  let confidence = 0.55;
  let riskLevel: RiskLevel = 'Safe';

  if (threatScore >= 90) {
    mlClassification = 'ddos_attack';
    confidence = 0.92;
    riskLevel = 'Critical';
  } else if (threatScore >= 70) {
    mlClassification = 'high_risk';
    confidence = 0.85;
    riskLevel = 'Critical';
  } else if (threatScore >= 45) {
    mlClassification = 'suspicious';
    confidence = 0.75;
    riskLevel = 'Suspicious';
  } else {
    mlClassification = 'normal';
    confidence = 0.93;
    riskLevel = 'Safe';
  }

  // Blacklist status simulation
  const blacklistBucket = seed % 100;
  const blacklistStatus: IntelResponse['blacklistStatus'] =
    blacklistBucket < (riskLevel === 'Critical' ? 45 : riskLevel === 'Suspicious' ? 20 : 5)
      ? 'Blacklisted'
      : 'Not Blacklisted';

  const country = countries[seed % countries.length];
  const provider = providers[(seed >>> 8) % providers.length];

  const summary = (() => {
    if (riskLevel === 'Critical') {
      return `High likelihood of coordinated malicious activity (score ${threatScore}/100).`;
    }
    if (riskLevel === 'Suspicious') {
      return `Behavior deviates from baseline patterns (score ${threatScore}/100).`;
    }
    return `Traffic characteristics align with expected baseline (score ${threatScore}/100).`;
  })();

  return {
    threatScore,
    country,
    provider,
    requestRate: Number(requestRate.toFixed(2)),
    blacklistStatus,
    mlClassification,
    confidence,
    riskLevel,
    summary,
  };
}

// Protected (so it’s consistent with the rest of the app)
router.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    const { queryType, value } = req.body as { queryType: QueryType; value: string };

    if (!queryType || !value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Missing queryType or value' });
    }

    const intel = makeDeterministicIntel(queryType, value);

    // Optional lightweight persistence using existing schema:
    // We’ll store an “intel lookup” as an ActivityLog only (no new tables).
    // This keeps DB changes minimal.
    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'INTEL_ANALYZED',
        description: `Intel analyzed: ${queryType}=${value}. Risk=${intel.riskLevel} Score=${intel.threatScore}`,
        resourceType: 'Intel',
        resourceId: `${queryType}:${value}`,
      },
    });

    return res.json(intel);
  } catch (error) {
    console.error('Intel analyze error:', error);
    return res.status(500).json({ error: 'Failed to analyze intelligence' });
  }
});

export default router;

