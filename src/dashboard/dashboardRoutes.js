
import express from 'express';
import { getGuildConfig } from '../services/config/guildConfig.js';

export default function registerDashboardRoutes(app, bot) {
  const router = express.Router();

  // Read-only for now. Login and permission checks must be added
  // before any route is allowed to change server settings.
  router.get('/config/:guildId', async (req, res) => {
    try {
      const { guildId } = req.params;

      // Only show settings for servers the bot is actually in.
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
