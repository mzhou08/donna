"use node";

import {google} from "googleapis";
import {action, httpAction} from "./_generated/server";
import {v} from "convex/values";
import {createClerkClient} from "@clerk/backend";
import {api} from "./_generated/api";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const calendar = google.calendar({ version: "v3" });

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

export const getFreeSlotsHelper = action({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, 'oauth_google').catch((error) => { console.log(error) });
    const accessToken = response?.data[0]?.token

    console.log("Running getFreeSlots...");

    if (accessToken) {
      const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
      auth.setCredentials({ access_token: accessToken });
      google.options({ auth });

      console.log("Getting calendars...");

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

        return freeIntervals.map((interval) => [interval[0].toISOString(), interval[1].toISOString()]);
      }

      return [];
    }
  },
});

export const getFreeSlots = httpAction(async (ctx, request) => {
  // call getFreeSlotsHelper
  const req = await request.json();

  const freeSlots = await ctx.runAction(api.googleIntegration.getFreeSlotsHelper, {id: req.id});

  return new Response(
    new Blob([
      JSON.stringify(freeSlots)
    ]),
    {
      status: 200,
    }
  );

});

export const addEvent = action({
  args: {
    id: v.string(),
    start: v.string(),
    end: v.string(),
    summary: v.string(),
    attendees: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, 'oauth_google').catch((error) => { console.log(error) });
    const accessToken = response?.data[0]?.token

    console.log("Running addEvent...");

    if (accessToken) {
      const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
      auth.setCredentials({ access_token: accessToken });
      google.options({ auth });

      console.log(args.start)

      const event = {
        summary: args.summary,
        start: {
          dateTime: args.start,
        },
        end: {
          dateTime: args.end,
        },
        attendees: args.attendees.map((attendee) => ({ email: attendee })),
      };

      console.log("Creating event...");

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      }).catch((error) => { console.log(error) });

      if (res)
        console.log("Event created: ", res.data);

      if (!res)
        console.log("Event not created");
    }
  },
});

export const getContacts = action({
  args: {
    id: v.string()
  },
  handler: async (ctx, args) => {
    const response = await clerkClient.users.getUserOauthAccessToken(args.id, 'oauth_google').catch((error) => {
      console.log(error)
    });
    const accessToken = response?.data[0]?.token

    console.log("Running getContacts...");

    if (accessToken) {
      const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
      auth.setCredentials({access_token: accessToken});
      google.options({auth});

      console.log("Getting contacts...");

      const res = await google.people({version: 'v1', auth}).people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers',
      }).catch((error) => {
        console.log(error)
      });

      const connections = res?.data.connections;

      if (connections) {
        console.log("Contacts: ", connections);
        const contacts = connections.map((contact) => {
          return {
            id: null,
            name: contact.names?.[0]?.displayName || "",
            email: contact.emailAddresses?.[0]?.value || "",
            phone: contact.phoneNumbers?.[0]?.value || "",
            agentAddress: null,
          }
        });

        const foundOutput = await ctx.runQuery(api.functions.getAllUsersByPhone, {phoneNumbers: contacts.map((contact) => contact.phone)});

        const found: { id: string; name: string; phone: string; email: string; agentAddress: string; }[] = foundOutput.userData.map((user: { id: string; name: string; phone: string; email: string; agentAddress: string; }) => {
          return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            agentAddress: user.agentAddress,
          }
        });

        let updatedContacts = [];
        for (const contact of contacts) {
          let foundContact = found.find((found) => found.phone === contact.phone);
          if (foundContact) {
            updatedContacts.push(foundContact);
          } else {
            updatedContacts.push(contact);
          }
        }

        return updatedContacts;
      }

      if (!connections)
        console.log("Contacts not found");
    }
    return [];
  },
});
