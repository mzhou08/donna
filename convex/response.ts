import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

export const getUserResponseStatus = query({
    args: {
        userId: v.string(),
        requestingUserId: v.string(),
        request: v.string(),
    },
  
    handler: async (ctx, args) => {
      const responseStatus = await ctx.db
        .query("userResponseStatus")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("requestingUserId"), args.requestingUserId),
            q.eq(q.field("request"), args.request)
          )
        )
        .collect();
  
      return {
          responseStatus: responseStatus.length > 0 ? responseStatus[0] : null,
      };
    },
  });
  
export const userResponseStatus = httpAction(async (ctx, request) => {
    const req = await request.json();
  
    if (req) {
      const userId = req.userId;
      const requestingUserId = req.requestingUserId;
      const request = req.request;
  
      const {responseStatus} = await ctx.runQuery(api.response.getUserResponseStatus, {
        userId: userId,
        requestingUserId: requestingUserId,
        request: request,
      });
  
      if (responseStatus) {
        return new Response(
          new Blob([
              JSON.stringify({didRespond: responseStatus.didRespond,})
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