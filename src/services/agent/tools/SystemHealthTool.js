'use strict';

const { z } = require('zod');
const os = require('os');
const BaseTool = require('@services/agent/core/BaseTool');

/**
 * Tool inspecting system uptime, memory usage, load averages, and database connectivity.
 */
class SystemHealthTool extends BaseTool {
  constructor() {
    const schema = z.object({
      checkDatabase: z.boolean().optional().describe('Set true to ping MySQL connection')
    });

    super(
      'system_health',
      'Inspects system memory usage, CPU load, process uptime, and database connectivity.',
      schema
    );
  }

  async execute(parameters, context = {}) {
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const usedMemMb = totalMemMb - freeMemMb;
    const memUsagePercent = Math.round((usedMemMb / totalMemMb) * 100);

    const healthData = {
      platform: os.platform(),
      nodeVersion: process.version,
      processUptimeSeconds: Math.round(process.uptime()),
      systemUptimeSeconds: Math.round(os.uptime()),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      memory: {
        totalMb: totalMemMb,
        usedMb: usedMemMb,
        freeMb: freeMemMb,
        percentUsed: `${memUsagePercent}%`
      },
      databaseStatus: 'unknown'
    };

    if (parameters?.checkDatabase) {
      const db = context.database || context.db;
      if (db) {
        try {
          await db.query('SELECT 1');
          healthData.databaseStatus = 'online';
        } catch (error) {
          healthData.databaseStatus = `error: ${error.message}`;
        }
      }
    }

    return {
      success: true,
      health: healthData
    };
  }
}

module.exports = SystemHealthTool;
