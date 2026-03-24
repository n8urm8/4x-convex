import { query } from './_generated/server';
import { DEV_GAME_TOOLS_ENABLED } from './env';

/** Lets the client hide dev-only controls when Convex DEV_GAME_TOOLS is off. */
export const getDevGameToolsStatus = query({
  args: {},
  handler: async () => ({ enabled: DEV_GAME_TOOLS_ENABLED }),
});
