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
    });

    // Initialize player resources
    const resourceDefinitions = await ctx.db
      .query("resourceDefinitions")
      .collect();

    for (const resourceDef of resourceDefinitions) {
      let initialAmount = 0;
      
      // Set starting amounts
      if (resourceDef.code === 'nova') initialAmount = 0;
      else if (resourceDef.code === 'mineral') initialAmount = 1000;
      else if (resourceDef.code === 'volatile') initialAmount = 500;
      
      await ctx.db.insert("playerResources", {
        userId,
        resourceDefinitionId: resourceDef._id,
        amount: initialAmount,
        lastUpdated: Date.now(),
      });
    }

    return userId;
  },
});
