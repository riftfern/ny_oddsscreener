import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

// GET /api/settings — no secrets, just whether server-side extras are armed.
router.get('/', (_req, res) => {
  res.json({
    telegram: {
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      mockDisabled: process.env.USE_MOCK_DATA === 'true',
    },
  });
});

export default router;
