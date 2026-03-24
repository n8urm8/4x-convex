/** When true, enables dev-only Convex mutations (instant complete, grant resources). Set on the deployment: `pnpm exec convex env set DEV_GAME_TOOLS true` (shell env is not passed into Convex functions). */
export const DEV_GAME_TOOLS_ENABLED =
  process.env.DEV_GAME_TOOLS === 'true' ||
  process.env.DEV_GAME_TOOLS === '1';

export const AUTH_RESEND_KEY = process.env.AUTH_RESEND_KEY;
export const AUTH_EMAIL = process.env.AUTH_EMAIL;
export const HOST_URL = process.env.HOST_URL;
export const SITE_URL = process.env.SITE_URL;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
