import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

export const getUser = query({
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

export const message = httpAction(async (ctx, request) => {
  const req = await request.json();

  if (req) {
    const name = req.name;

    const {userData} = await ctx.runQuery(api.queries.getUser, {
      name: name,
    });

    if (userData) {
      return new Response(
        new Blob([
            JSON.stringify({phone: userData.phone,})
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

