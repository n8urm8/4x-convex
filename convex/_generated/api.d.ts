/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as app from "../app.js";
import type * as auth from "../auth.js";
import type * as devQueries from "../devQueries.js";
import type * as devTools from "../devTools.js";
import type * as email_index from "../email/index.js";
import type * as email_templates_subscriptionEmail from "../email/templates/subscriptionEmail.js";
import type * as env from "../env.js";
import type * as game_bases_baseEconomy from "../game/bases/baseEconomy.js";
import type * as game_bases_baseInitialization from "../game/bases/baseInitialization.js";
import type * as game_bases_baseMutations from "../game/bases/baseMutations.js";
import type * as game_bases_baseQueries from "../game/bases/baseQueries.js";
import type * as game_bases_constants from "../game/bases/constants.js";
import type * as game_bases_devMutations from "../game/bases/devMutations.js";
import type * as game_bases_seedDefensiveStructures from "../game/bases/seedDefensiveStructures.js";
import type * as game_bases_structureEffects from "../game/bases/structureEffects.js";
import type * as game_bases_structureMutations from "../game/bases/structureMutations.js";
import type * as game_bases_structureQueries from "../game/bases/structureQueries.js";
import type * as game_fleets_fleetActions from "../game/fleets/fleetActions.js";
import type * as game_fleets_fleetQueries from "../game/fleets/fleetQueries.js";
import type * as game_map_galaxyGeneration from "../game/map/galaxyGeneration.js";
import type * as game_map_galaxyQueries from "../game/map/galaxyQueries.js";
import type * as game_map_systemMutations from "../game/map/systemMutations.js";
import type * as game_research_researchActions from "../game/research/researchActions.js";
import type * as game_research_researchMutations from "../game/research/researchMutations.js";
import type * as game_research_researchQueries from "../game/research/researchQueries.js";
import type * as game_resources_resourceHelpers from "../game/resources/resourceHelpers.js";
import type * as game_ships_shipActions from "../game/ships/shipActions.js";
import type * as game_ships_shipBlueprints from "../game/ships/shipBlueprints.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as otp_DevEmail from "../otp/DevEmail.js";
import type * as otp_ResendOTP from "../otp/ResendOTP.js";
import type * as otp_VerificationCodeEmail from "../otp/VerificationCodeEmail.js";
import type * as otp_devEmailHelpers from "../otp/devEmailHelpers.js";
import type * as seed_planetTypesSeed from "../seed/planetTypesSeed.js";
import type * as seed_researchSeed from "../seed/researchSeed.js";
import type * as seed_resourceCostSeed from "../seed/resourceCostSeed.js";
import type * as seed_resourceDefinitionsSeed from "../seed/resourceDefinitionsSeed.js";
import type * as seed_structuresSeed from "../seed/structuresSeed.js";
import type * as stripe from "../stripe.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  app: typeof app;
  auth: typeof auth;
  devQueries: typeof devQueries;
  devTools: typeof devTools;
  "email/index": typeof email_index;
  "email/templates/subscriptionEmail": typeof email_templates_subscriptionEmail;
  env: typeof env;
  "game/bases/baseEconomy": typeof game_bases_baseEconomy;
  "game/bases/baseInitialization": typeof game_bases_baseInitialization;
  "game/bases/baseMutations": typeof game_bases_baseMutations;
  "game/bases/baseQueries": typeof game_bases_baseQueries;
  "game/bases/constants": typeof game_bases_constants;
  "game/bases/devMutations": typeof game_bases_devMutations;
  "game/bases/seedDefensiveStructures": typeof game_bases_seedDefensiveStructures;
  "game/bases/structureEffects": typeof game_bases_structureEffects;
  "game/bases/structureMutations": typeof game_bases_structureMutations;
  "game/bases/structureQueries": typeof game_bases_structureQueries;
  "game/fleets/fleetActions": typeof game_fleets_fleetActions;
  "game/fleets/fleetQueries": typeof game_fleets_fleetQueries;
  "game/map/galaxyGeneration": typeof game_map_galaxyGeneration;
  "game/map/galaxyQueries": typeof game_map_galaxyQueries;
  "game/map/systemMutations": typeof game_map_systemMutations;
  "game/research/researchActions": typeof game_research_researchActions;
  "game/research/researchMutations": typeof game_research_researchMutations;
  "game/research/researchQueries": typeof game_research_researchQueries;
  "game/resources/resourceHelpers": typeof game_resources_resourceHelpers;
  "game/ships/shipActions": typeof game_ships_shipActions;
  "game/ships/shipBlueprints": typeof game_ships_shipBlueprints;
  http: typeof http;
  init: typeof init;
  "otp/DevEmail": typeof otp_DevEmail;
  "otp/ResendOTP": typeof otp_ResendOTP;
  "otp/VerificationCodeEmail": typeof otp_VerificationCodeEmail;
  "otp/devEmailHelpers": typeof otp_devEmailHelpers;
  "seed/planetTypesSeed": typeof seed_planetTypesSeed;
  "seed/researchSeed": typeof seed_researchSeed;
  "seed/resourceCostSeed": typeof seed_resourceCostSeed;
  "seed/resourceDefinitionsSeed": typeof seed_resourceDefinitionsSeed;
  "seed/structuresSeed": typeof seed_structuresSeed;
  stripe: typeof stripe;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
