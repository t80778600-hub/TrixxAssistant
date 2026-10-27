import express from 'express';
import {
  createHmac,
  timingSafeEqual
} from 'node:crypto';
import { getGuildConfig } from '../services/config/guildConfig.js';

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
      expires > Date.now() + SESSION_DURATION + 60_000 ||
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

  // Login using the secret stored in Railway, never in the webpage.
  router.post('/login', express.json(), (req, res) => {
    const expected = process.env.DASHBOARD_SECRET;
    const supplied = req.body?.password;

    if (!expected || typeof supplied !== 'string') {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);

    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${createSessionToken()}; HttpOnly; Secure; SameSite=Strict; Path=/api/dashboard; Max-Age=28800`
    );

    return res.json({ success: true });
  });

  // Check whether the browser is logged in.
  router.get('/session', (req, res) => {
    return res.json({ authenticated: isValidSession(req) });
  });

  // Log out by clearing the session cookie.
  router.post('/logout', (req, res) => {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/dashboard; Max-Age=0`
    );

    return res.json({ success: true });
  });

  // Read server configuration only after login.
  router.get('/config/:guildId', requireLogin, async (req, res) => {
    try {
      const { guildId } = req.params;
      const guild = bot.guilds.cache.get(guildId);

      if (!guild) {
        return res.status(404).json({
          error: 'Server not found'
        });
      }

      const config = await getGuildConfig(bot, guildId);

      return res.json({ guildId, config });
    } catch (error) {
      console.error('Dashboard config read failed:', error.message);

      return res.status(500).json({
        error: 'Could not load server configuration'
      });
    }
  });

  app.use('/api/dashboard', router);
}
