import { Router } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      usedMB: number;
      totalMB: number;
      percentUsed: number;
    };
  };
}

async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function checkMemoryHealth(): { status: 'healthy' | 'warning' | 'critical'; usedMB: number; totalMB: number; percentUsed: number } {
  const memUsage = process.memoryUsage();
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (percentUsed > 90) {
    status = 'critical';
  } else if (percentUsed > 75) {
    status = 'warning';
  }
  
  return { status, usedMB, totalMB, percentUsed };
}

router.get('/', async (req, res) => {
  const [dbHealth, memHealth] = await Promise.all([
    checkDatabaseHealth(),
    Promise.resolve(checkMemoryHealth()),
  ]);
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (dbHealth.status === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (memHealth.status === 'critical') {
    overallStatus = 'degraded';
  } else if (memHealth.status === 'warning') {
    overallStatus = 'degraded';
  }
  
  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: dbHealth,
      memory: memHealth,
    },
  };
  
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthCheck);
});

router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  if (dbHealth.status === 'healthy') {
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: 'not_ready', reason: 'database_unavailable' });
  }
});

export default router;
