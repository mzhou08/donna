# donna
HackMIT 2024 - Your AI-powered personal assistant. Won the best full-stack app prize by Convex.

### Inspiration

In today’s fast-paced world, scheduling meetings, events, and meetups can be a tedious and time-consuming process. Most people don’t have access to a personal assistant—unless you’re a famous CS professor at CMU or MIT. That's where Donna comes in: a scalable, personalized AI assistant designed to handle your scheduling needs with ease, offering the kind of support typically reserved for top executives. Donna makes personal assistance accessible to everyone!

### What it does

The process is simple: sign up for Donna on our website using your Google email and phone number, which will give Donna access to your Google Calendar and Contacts. Whenever you want to schedule a meeting, just drop Donna a message like, “Hey, could I meet up with Michael in the next two weeks?” Donna will handle the rest! Whether Michael has his own Donna or not, your assistant will communicate to find the best time and location that fits both your schedules, making event planning effortless.

### How we built it

We built the sign-up web platform using a combination of Clerk, React, and Convex, which made authentication, backend development, and database management a breeze. We used a Telegram bot to simulate Donna's messaging functionality, leveraging webhooks. For calendar and contact syncing, we used the Node version of Google APIs, with OAuth handled smoothly through Clerk. Lastly, we integrated [Fetch.ai](http://fetch.ai/) as the LLM agent to parse user messages and efficiently schedule meeting times.

### Challenges

We initially planned to use Twilio for text messaging, but verification issues prompted us to switch to a Telegram bot to simulate Donna’s messaging functionality.

Some of the technical hurdles we encountered along the way include:

- Google APIs Integration: While importing Google APIs, we ran into an error stating that basic packages were unavailable. After some research, we discovered that Convex doesn't use Node.js to speed up deployments. With guidance from a Convex team member on Discord, we figured out how to integrate Google APIs with Convex.
- Google OAuth Issues: Initially, I tried using the access token from Clerk, which expires over time, to obtain a refresh token and save it in the database for ongoing Google API calls. After diving deep into this approach, I realised a simpler solution: leverage Clerk's capabilities to fetch a new access token each time it's needed, avoiding the complexity of managing tokens manually. Sometimes, the simplest solution is the best one!

### Accomplishments

We’re proud of pulling together a range of different tools and technologies into one cohesive project: Clerk for authentication, Convex for the backend, the Telegram Bot API for messaging, Google APIs for calendar and contact syncing, and [Fetch.ai](http://fetch.ai/) for the intelligent scheduling agent. Seeing all these moving parts work seamlessly together was an incredibly satisfying achievement, and it showcased our ability to integrate complex systems into a smooth user experience!

### What we learnt

Learning to work with a variety of tools was incredibly eye-opening. It was exciting to integrate our product with everyday platforms like websites, login pages, messaging systems, Google Calendar, and Contacts. Using AI agents for the first time and seeing them make executive decisions, just like a real assistant, was particularly cool.

We also honed important skills in communication and teamwork. Breaking down the project into separate parts allowed us to work in parallel: Xavier focused on web and bot development, while Michael worked on the AI agent. Clear communication about how the bot would interact with the AI agent and how data would be stored in the database was essential to ensure we could both deliver what the other needed for the project to function smoothly.

### What’s next

Given more time, we would love to expand Donna by connecting it to other services that would further enhance the user experience. For instance, integrating Donna with an email client could allow it to detect meeting requests, suggest convenient times, and even reply on the user’s behalf. Automatically scheduling Zoom meetings when necessary would be another key improvement.

We also envision Donna prompting users to meet up with friends they haven’t seen in a while, linking up with APIs to book restaurants, and asking for feedback on the experience to refine preferences. Additionally, incorporating more personalised options, such as preferred meeting times and travel distance, would allow for an even more tailored experience.

In the future, Donna could also help users run errands, like booking appointments at frequently visited locations, making it a true personal assistant for everyday life.

# Convex + TypeScript + ESLint + Vite + React + Clerk + Tailwind + shadcn/ui

This template provides a minimal setup to get Convex working, with TypeScript,
ESLint and React using [Vite](https://vitejs.dev/). It uses [Clerk](https://clerk.dev/) for user authentication.

Start by editing `convex/functions.ts` and interact with your React app.

See Convex docs at https://docs.convex.dev/home

## Setting up

```
npm create convex@latest -t react-vite-clerk-shadcn
```

Then:

1. Follow steps 1 to 3 in the [Clerk onboarding guide](https://docs.convex.dev/auth/clerk#get-started)
2. Paste the Issuer URL as `CLERK_JWT_ISSUER_DOMAIN` to your dev deployment environment variable settings on the Convex dashboard (see [docs](https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances))
3. Paste your publishable key as `VITE_CLERK_PUBLISHABLE_KEY="<your publishable key>"` to the `.env.local` file in this directory.

If you want to sync Clerk user data via webhooks, check out this [example repo](https://github.com/thomasballinger/convex-clerk-users-table/).
