
import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getGuildConfig } from '../services/config/guildConfig.js';

export default function registerDashboardRoutes(app, bot) {
  const router = express.Router();

  // Check the secret supplied in the Authorization header.
  function requireDashboardSecret(req, res, next) {
    const expected = process.env.DASHBOARD_SECRET;
    const supplied = req.get('Authorization')?.replace(/^Bearer\s+/i, '');

    if (!expected || !supplied) {
      return res.status(401).json({
        error: 'Dashboard authentication required'
      });
    }

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return res.status(401).json({
        error: 'Invalid dashboard secret'
      });
    }

    next();
  }

  // Read-only configuration endpoint, protected by the secret.
  router.get('/config/:guildId', requireDashboardSecret, async (req, res) => {
    try {
      const { guildId } = req.params;
      const guild = bot.guilds.cache.get(guildId);

      if (!guild) {
        return res.status(404).json({
          error: 'Server not found'
        });
      }

      const config = await getGuildConfig(bot, guildId);

      return res.json({
        guildId,
        config
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Could not load server configuration'
      });
    }
  });

  app.use('/api/dashboard', router);
}
