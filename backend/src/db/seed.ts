import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      role: 'USER',
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create sample traffic logs
  for (let i = 0; i < 20; i++) {
    const sourceIp = `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
    const predictions = ['normal', 'suspicious', 'high_risk', 'ddos_attack'];
    const predictionsBySeverity: Record<string, string> = {
      low: 'normal',
      medium: 'suspicious',
      high: 'high_risk',
      critical: 'ddos_attack',
    };

    const prediction = predictionsBySeverity[severity];

    const log = await prisma.trafficLog.create({
      data: {
        userId: user.id,
        sourceIp,
        destinationIp: '10.0.0.1',
        port: Math.floor(Math.random() * 65535) + 1,
        protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
        packetCount: Math.floor(Math.random() * 1000) + 10,
        byteCount: Math.floor(Math.random() * 100000) + 1000,
        severity,
      },
    });

    await prisma.prediction.create({
      data: {
        trafficLogId: log.id,
        prediction,
        confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
        modelVersion: '1.0',
      },
    });

    if (severity === 'high' || severity === 'critical') {
      await prisma.alert.create({
        data: {
          title: `${prediction.toUpperCase()} detected`,
          description: `Suspicious traffic from ${sourceIp}`,
          severity,
          trafficLogId: log.id,
        },
      });
    }
  }

  console.log('✅ Created traffic logs and predictions');

  // Create sample alerts
  const alert = await prisma.alert.create({
    data: {
      title: 'DDoS Attack Detected',
      description: 'Unusual traffic spike detected from multiple sources',
      severity: 'critical',
    },
  });

  await prisma.incident.create({
    data: {
      alertId: alert.id,
      description: 'Ongoing investigation into traffic anomaly',
    },
  });

  console.log('✅ Created sample alerts and incidents');

  // Create sample report
  await prisma.report.create({
    data: {
      title: 'Daily Security Report',
      description: 'Daily security summary',
      type: 'daily_report',
      data: {
        totalAlerts: 5,
        resolvedAlerts: 2,
        criticalAlerts: 1,
      },
    },
  });

  console.log('✅ Created sample reports');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
