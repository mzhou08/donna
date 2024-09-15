"use node";

import {google} from "googleapis";
import {action} from "./_generated/server";
import {v} from "convex/values";
import {createClerkClient} from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

const MINIMUM_INTERVAL_MINUTES = 30;  // could be personalized

function mergeIntervals(intervals: Date[][]) {
  if (intervals.length === 0) return [];

  // Sort intervals by start time
  intervals.sort((a, b) => a[0].getTime() - b[0].getTime());

  const merged = [];
  let currentInterval = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const [currentStart, currentEnd] = currentInterval;
    const [nextStart, nextEnd] = intervals[i];

    if (currentEnd.getTime() + MINIMUM_INTERVAL_MINUTES * 60 * 1000 >= nextStart.getTime()) {
      // Overlapping intervals, merge them
      currentInterval = [currentStart, new Date(Math.max(currentEnd.getTime(), nextEnd.getTime()))];
    } else {
      // No overlap, push the current interval and move to the next
      merged.push(currentInterval);
      currentInterval = intervals[i];
    }
  }

  // Push the last interval
  merged.push(currentInterval);

  return merged;
}

function getFreeIntervals(intervals: Date[][]) {
  const mergedIntervals = mergeIntervals(intervals);
  const freeIntervals = [];

  const end = new Date(Date.now() + 12096e5);
  let lastEnd = new Date();

  for (const [currentStart, currentEnd] of mergedIntervals) {
    if (lastEnd < currentStart) {
      freeIntervals.push([lastEnd, currentStart]);
    }
    lastEnd = currentEnd;
  }

  if (lastEnd < end) {
    freeIntervals.push([lastEnd, end]);
  }

  return freeIntervals;
}

export const getFreeSlots = action({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, 'oauth_google').catch((error) => { console.log(error) });
    const accessToken = response?.data[0]?.token

    console.log("Running getFreeSlots...");

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
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: (new Date()).toISOString(),
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
        events = events.filter((event) => event && event.start && event.end);

        events = events.sort((a, b) => {
          if (!a?.start || !b?.start) return 0;
          return a?.start < b?.start ? -1 : 1;
        });

        console.log("Events: ", events);

        const now = new Date();
        console.log("Now: ", now);

        const intervals = events.map((event) => [new Date(event?.start || now), new Date(event?.end || now)]);

        const freeIntervals = getFreeIntervals(intervals);

        console.log("Free intervals: ", freeIntervals);

        return freeIntervals.map((interval) => [interval[0].toLocaleString('en-US', { timeZone: 'America/New_York' }), interval[1].toLocaleString('en-US', { timeZone: 'America/New_York' })]);
      }

      return [];
    }
  },
});
