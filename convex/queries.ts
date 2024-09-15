import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

export const getUserByAgentAddress = query({
  args: {
    agentAddress: v.string(),
  },

  handler: async (ctx, args) => {
    const userData = await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("agentAddress"), args.agentAddress))
      .collect();

    return {
        userData: userData.length > 0 ? userData[0] : null,
    };
  },
});

export const userByAgentAddress = httpAction(async (ctx, request) => {
  const req = await request.json();

  if (req) {
    const agentAddress = req.agentAddress;

    const {userData} = await ctx.runQuery(api.queries.getUserByAgentAddress, {
      agentAddress: agentAddress,
    });

    if (userData) {
      return new Response(
        new Blob([
            JSON.stringify({
                phone: userData.phone,
                name: userData.name,
            })
        ]),
        {
            status: 200,
        }
      );
    } else {
      return new Response(null, {
        status: 200,
      });
    }
  }

  return new Response(null, {
    status: 400,
  });
});


export const getUserByName = query({
  args: {
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const userData = await ctx.db
      .query("users")
      .collect()
      .then((data) =>
        data.filter(
            (user) => user.name.split(" ")[0].toLowerCase() === args.name.toLowerCase()
        )
      );

    return {
        userData: userData.length > 0 ? userData[0] : null,
    };
  },
});

export const userByName = httpAction(async (ctx, request) => {
  const req = await request.json();

  if (req) {
    const name = req.name;

    const {userData} = await ctx.runQuery(api.queries.getUserByName, {
      name: name,
    });

    if (userData) {
      return new Response(
        new Blob([
            JSON.stringify({agentAddress: userData.agentAddress,})
        ]),
        {
            status: 200,
        }
      );
    } else {
      return new Response(null, {
        status: 200,
      });
    }
  }

  return new Response(null, {
    status: 400,
  });
});

