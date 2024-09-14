import { httpRouter } from "convex/server";
import { getUserApi } from "./functions";

const http = httpRouter();

http.route({
  path: "/getUser",
  method: "POST",
  handler: getUserApi,
});

export default http;