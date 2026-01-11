import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Value } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Development-only email provider that skips verification.
 * WARNING: Do not use in production!
 */
export const DevEmail = ConvexCredentials({
  id: "dev-email",
  authorize: async (
    credentials: Partial<Record<string, Value | undefined>>,
    ctx
  ): Promise<{ userId: Id<"users"> } | null> => {
    const email = credentials?.email as string | undefined;
    if (!email) {
      throw new Error("Email is required");
    }
    // Get or create user with this email
    const userId: Id<"users"> = await ctx.runMutation(internal.otp.devEmailHelpers.getOrCreateUser, { email });
    return { userId };
  },
});
