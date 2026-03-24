import { DEV_GAME_TOOLS_ENABLED } from './env';

/** Throws unless DEV_GAME_TOOLS=true on this Convex deployment (set in dev only). */
export function assertDevGameTools(): void {
  if (!DEV_GAME_TOOLS_ENABLED) {
    throw new Error(
      'Developer tools are not enabled on this Convex deployment. Run once: pnpm exec convex env set DEV_GAME_TOOLS true (dev deployment only; shell/package.json env does not apply to functions).'
    );
  }
}
