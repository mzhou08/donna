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
import type * as functions from "../functions.js";
import type * as googleIntegration from "../googleIntegration.js";
import type * as http from "../http.js";
import type * as response from "../response.js";
import type * as telegramHelper from "../telegramHelper.js";
import type * as userQueries from "../userQueries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  functions: typeof functions;
  googleIntegration: typeof googleIntegration;
  http: typeof http;
  response: typeof response;
  telegramHelper: typeof telegramHelper;
  userQueries: typeof userQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
