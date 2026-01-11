import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal helper to get or create a user by email for dev authentication.
 */
export const getOrCreateUser = internalMutation({
  args: { email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Look for existing user with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerificationTime: Date.now(),
      nova: 0,
      minerals: 1000,
      volatiles: 500,
    });

    return userId;
  },
});
