import { httpRouter } from "convex/server";
import { message } from "./functions";
import { userByAgentAddress, userByName } from "./queries";
import { getUserResponseStatus } from "./response";

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

// http.route({
//   path: "/user/response-status",
//   method: "GET",
//   handler: getUserResponseStatus,
// })

export default http;