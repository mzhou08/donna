"use node";

import { google } from "googleapis";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const getCalendars = action({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, 'oauth_google').catch((error) => { console.log(error) });
    const accessToken = response?.data[0]?.token

    if (accessToken) {
      const clientId = process.env.CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET;

      const auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ access_token: accessToken });
      google.options({ auth });

      const calendar = google.calendar({ version: "v3" });
      const calendars = await calendar.calendarList.list();

      return { calendars: calendars.data.items };
    }
  },
});
