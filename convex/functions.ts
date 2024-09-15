import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { sendMessage } from "./telegramHelper";
import {addEvent} from "./googleIntegration";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.


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

const showDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { timeZone: 'America/New_York' });
}

export const message = httpAction(async (ctx, request) => {
  const req = await request.json();

  if (req) {
    const message = req.message;
    const text = message.text;
    const phone = message.from.username;
    const chatId = message.from.id;

    const {userData} = await ctx.runQuery(api.functions.checkUser, {
      phone: phone,
    });

    if (userData) {
      const freeSlots = await ctx.runAction(api.googleIntegration.getFreeSlots, { id: userData.id });

      if (freeSlots) {
        await sendMessage(chatId, "Here are the three timeslots you can book, reply with the slot number you want to book:");
        for (const event of freeSlots.slice(0, 3)) {
          const i = freeSlots.indexOf(event);
          await sendMessage(chatId, `Slot ${i + 1}: from ${showDate(event[0])} to ${showDate(event[1])}`);
        }
        const event = freeSlots[0];
        await ctx.runAction(api.googleIntegration.addEvent, { id: userData.id, start: event[0], end: event[1], summary: "Meeting" });
      }

    } else {
      await sendMessage(chatId, "You have not been registered!");
    }
  }

  return new Response(null, {
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
    agentAddress: v.string(),
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
        agentAddress: args.agentAddress,
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

    const agentAddress = await
      fetch(
        process.env.NGROK_BACKEND_URL + "/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: args.phone,
            name: args.name,
          }),
        }
      ).then((response) =>
      // {console.log(response); return "";}
        response.json().then((data) => {
            return data.agent_address;
          }
        )
      );

    await ctx.runMutation(api.functions.addUserData, {
      id: args.id,
      name: args.name,
      email: args.email,
      phone: "xavilien",  // testing purposes
      agentAddress: agentAddress,
    });
  },
});
