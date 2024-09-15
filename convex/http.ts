import { httpRouter } from "convex/server";
import { message } from "./functions";
import { userByAgentAddress, userByName } from "./queries";

const http = httpRouter();

http.route({
  path: "/message",
  method: "POST",
  handler: message,
});

http.route({
  path: "/user/name",
  method: "GET",
  handler: userByName,
})

http.route({
  path: "/user/agent-address",
  method: "GET",
  handler: userByAgentAddress,
})

export default http;