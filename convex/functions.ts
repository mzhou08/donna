import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export const checkUser = query({
  // Validators for arguments.
  args: {
    id: v.string(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const userData = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), args.id))
      .collect();

    return {
      userData: userData.length > 0 ? userData[0] : null,
    };
  },
});

// You can write data to the database via a mutation:
export const addUser = mutation({
  // Validators for arguments.
  args: {
    id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
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
      });
      console.log(`Added new document with id: ${databaseId}, name: ${args.name}, email: ${args.email}, phone: ${args.phone}`);
    }
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.functions.checkUser, {
      id: "10",
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.functions.addUser, {
      id: "10",
      name: "John Doe",
      email: "",
      phone: "",
    });
  },
});
