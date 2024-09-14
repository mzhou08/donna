import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { createClerkClient } from "@clerk/backend";
import { httpAction } from "./_generated/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

// You can read data from the database via a query:
export const checkUser = query({
  // Validators for arguments.
  args: {
    phone: v.string(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const userData = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .collect();

    return {
      userData: userData.length > 0 ? userData[0] : null,
    };
  },
});

export const getUserApi = httpAction(async (ctx, request) => {
  const { phone } = await request.json();

  const userData = await ctx.runQuery(api.functions.checkUser, {
    phone: phone,
  });

  return new Response(JSON.stringify(userData), {
    status: 200,
  });
});


// You can write data to the database via a mutation:
export const addUserData = mutation({
  // Validators for arguments.
  args: {
    id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    token: v.string(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const userData = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), args.id))
      .collect();

    if (userData.length === 0) {
      const databaseId = await ctx.db.insert("users", {
        id: args.id,
        name: args.name,
        email: args.email,
        phone: args.phone,
        token: args.token,
      });
      console.log(`Added new document with id: ${databaseId}, name: ${args.name}, email: ${args.email}, phone: ${args.phone}`);
    }
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const addUser = action({
  // Validators for arguments.
  args: {
    id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    const provider = 'oauth_google'
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, provider).catch((error) => { console.log(error) });

    if (response) {
      console.log(response.data[0].token)

      await ctx.runMutation(api.functions.addUserData, {
        id: args.id,
        name: args.name,
        email: args.email,
        phone: args.phone,
        token: response.data[0].token,
      });
    }
  },
});
