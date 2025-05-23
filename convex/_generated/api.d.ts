/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as app from "../app.js";
import type * as auth from "../auth.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as env from "../env.js";
import type * as game_bases_baseMutations from "../game/bases/baseMutations.js";
import type * as game_bases_baseQueries from "../game/bases/baseQueries.js";
import type * as game_map_galaxyGeneration from "../game/map/galaxyGeneration.js";
import type * as game_map_galaxyQueries from "../game/map/galaxyQueries.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as otp_ResendOTP from "../otp/ResendOTP.js";
import type * as otp_VerificationCodeEmail from "../otp/VerificationCodeEmail.js";
import type * as seed_planetTypesSeed from "../seed/planetTypesSeed.js";
import type * as stripe from "../stripe.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  app: typeof app;
  auth: typeof auth;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  env: typeof env;
  "game/bases/baseMutations": typeof game_bases_baseMutations;
  "game/bases/baseQueries": typeof game_bases_baseQueries;
  "game/map/galaxyGeneration": typeof game_map_galaxyGeneration;
  "game/map/galaxyQueries": typeof game_map_galaxyQueries;
  http: typeof http;
  init: typeof init;
  "otp/ResendOTP": typeof otp_ResendOTP;
  "otp/VerificationCodeEmail": typeof otp_VerificationCodeEmail;
  "seed/planetTypesSeed": typeof seed_planetTypesSeed;
  stripe: typeof stripe;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
