import express from 'express';
import {
  createHmac,
  timingSafeEqual
} from 'node:crypto';
import {
  getGuildConfig,
  patchGuildConfig
} from '../services/config/guildConfig.js';

export default function registerDashboardRoutes(app, bot) {
  const router = express.Router();

  const SESSION_COOKIE = 'titan_dashboard_session';
  const SESSION_DURATION = 8 * 60 * 60 * 1000;

  function createSessionToken() {
    const secret = process.env.DASHBOARD_SECRET;
    const expires = Date.now() + SESSION_DURATION;
    const signature = createHmac('sha256', secret)
      .update(String(expires))
      .digest('hex');

    return `${expires}.${signature}`;
  }

  function isValidSession(req) {
    const secret = process.env.DASHBOARD_SECRET;
    if (!secret) return false;

    const cookieHeader = req.headers.cookie || '';
    const cookie = cookieHeader
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(`${SESSION_COOKIE}=`));

    if (!cookie) return false;

    const token = cookie.slice(SESSION_COOKIE.length + 1);
    const [expiresText, suppliedSignature] = token.split('.');
    const expires = Number(expiresText);

    if (
      !Number.isSafeInteger(expires) ||
      expires <= Date.now() ||
      expires > Date.now() + SESSION_DURATION + 60000 ||
      !/^[a-f0-9]{64}$/.test(suppliedSignature || '')
    ) {
      return false;
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(String(expires))
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(suppliedSignature, 'hex')
    );
  }

  function requireLogin(req, res, next) {
    if (!isValidSession(req)) {
      return res.status(401).json({
        error: 'Please log in to the dashboard'
      });
    }

    next();
  }

  function getGuild(guildId) {
    if (!/^\d{17,20}$/.test(guildId)) return null;
    return bot.guilds.cache.get(guildId) || null;
  }

  router.post('/login', express.json(), (req, res) => {
    const expected = process.env.DASHBOARD_SECRET;
    const supplied = req.body?.password;

    if (!expected || typeof supplied !== 'string') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${createSessionToken()}; HttpOnly; Secure; SameSite=Strict; Path=/api/dashboard; Max-Age=28800`
    );

    return res.json({ success: true });
  });

  router.get('/session', (req, res) => {
    return res.json({ authenticated: isValidSession(req) });
  });

  router.post('/logout', (req, res) => {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/dashboard; Max-Age=0`
    );

    return res.json({ success: true });
  });

  router.get('/config/:guildId', requireLogin, async (req, res) => {
    try {
      const guild = getGuild(req.params.guildId);

      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const config = await getGuildConfig(bot, guild.id);
      return res.json({ guildId: guild.id, config });
    } catch (error) {
      console.error('Dashboard config read failed:', error.message);
      return res.status(500).json({
        error: 'Could not load server configuration'
      });
    }
  });

  // Read the ticket settings used by the bot.
  router.get('/tickets/:guildId', requireLogin, async (req, res) => {
    try {
      const guild = getGuild(req.params.guildId);

      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const config = await getGuildConfig(bot, guild.id);

      return res.json({
        guildId: guild.id,
        settings: {
          ticketStaffRoleId: config.ticketStaffRoleId ?? '',
          ticketCategoryId: config.ticketCategoryId ?? '',
          ticketClosedCategoryId: config.ticketClosedCategoryId ?? '',
          ticketTranscriptChannelId: config.ticketTranscriptChannelId ?? '',
          dmOnClose: config.dmOnClose !== false,
          maxTicketsPerUser: config.maxTicketsPerUser ?? 3
        }
      });
    } catch (error) {
      console.error('Ticket settings read failed:', error.message);
      return res.status(500).json({
        error: 'Could not load ticket settings'
      });
    }
  });

  // Save only the supported ticket settings.
  router.put('/tickets/:guildId', requireLogin, express.json(), async (req, res) => {
    try {
      const guild = getGuild(req.params.guildId);

      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const body = req.body;

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'Invalid settings payload' });
      }

      const allowedKeys = [
        'ticketStaffRoleId',
        'ticketCategoryId',
        'ticketClosedCategoryId',
        'ticketTranscriptChannelId'
      ];

      const updates = {};

      for (const key of allowedKeys) {
        if (body[key] !== undefined) {
          if (
            typeof body[key] !== 'string' ||
            (body[key] !== '' && !/^\d{17,20}$/.test(body[key]))
          ) {
            return res.status(400).json({
              error: `Invalid value for ${key}`
            });
          }

          updates[key] = body[key] || null;
        }
      }

      if (body.dmOnClose !== undefined) {
        if (typeof body.dmOnClose !== 'boolean') {
          return res.status(400).json({
            error: 'dmOnClose must be true or false'
          });
        }

        updates.dmOnClose = body.dmOnClose;
      }

      if (body.maxTicketsPerUser !== undefined) {
        if (
          !Number.isInteger(body.maxTicketsPerUser) ||
          body.maxTicketsPerUser < 1 ||
          body.maxTicketsPerUser > 20
        ) {
          return res.status(400).json({
            error: 'Maximum tickets must be between 1 and 20'
          });
        }

        updates.maxTicketsPerUser = body.maxTicketsPerUser;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid ticket settings were provided'
        });
      }

      const config = await patchGuildConfig(
        bot,
        guild.id,
        updates,
        { source: 'dashboard' }
      );

      return res.json({
        success: true,
        settings: {
          ticketStaffRoleId: config.ticketStaffRoleId ?? '',
          ticketCategoryId: config.ticketCategoryId ?? '',
          ticketClosedCategoryId: config.ticketClosedCategoryId ?? '',
          ticketTranscriptChannelId: config.ticketTranscriptChannelId ?? '',
          dmOnClose: config.dmOnClose !== false,
          maxTicketsPerUser: config.maxTicketsPerUser ?? 3
        }
      });
    } catch (error) {
      console.error('Ticket settings save failed:', error.message);
      return res.status(500).json({
        error: 'Could not save ticket settings'
      });
    }
  });

  app.use('/api/dashboard', router);
}
