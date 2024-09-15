import { httpRouter } from "convex/server";
import { message } from "./functions";

const http = httpRouter();

http.route({
  path: "/message",
  method: "POST",
  handler: message,
});

export default http;