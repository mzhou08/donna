import { httpRouter } from "convex/server";
import { message } from "./functions";
import { userByAgentAddress, userByName } from "./userQueries";
import { userResponseStatus } from "./response";
import { getFreeSlots} from "./googleIntegration";

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

http.route({
  path: "/user/response-status",
  method: "GET",
  handler: userResponseStatus,
})

http.route({
  path: "/user/free-slots",
  method: "GET",
  handler: getFreeSlots,
})

export default http;