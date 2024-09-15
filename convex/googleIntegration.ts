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

    console.log("Running getCalendars...");

    if (accessToken) {
      const clientId = process.env.CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET;

      const auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ access_token: accessToken });
      google.options({ auth });

      console.log("Getting calendars...");

      const calendar = google.calendar({ version: "v3" });
      const calRes = await calendar.calendarList.list();
      const calendars = calRes.data.items;
      const ids = calendars?.map((cal) => cal.id);

      console.log("Calendars: ", ids);

      console.log("Getting events...")

      const eventPromises = ids?.flatMap(async (id) => {
        const eventRes = await calendar.events.list({
          calendarId: id || 'primary',
          timeMin: (new Date()).toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          timeMax: new Date(Date.now() + 12096e5).toISOString(),
        });

        return eventRes.data.items?.map((event) => {
          const start = event.start?.dateTime;
          const end = event.end?.dateTime;
          const summary = event.summary;

          return { start, end, summary };
        });
      });

      if (eventPromises) {
        const eventsUnflat = await Promise.all(eventPromises);
        let events = eventsUnflat.flat();
        console.log("Events: ", events);
        return events;
      }

      return [];
    }
  },
});
