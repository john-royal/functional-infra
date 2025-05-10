import { auth } from "./auth";
import { bucket } from "./storage";
import { neonProject } from "./neon";

export const myApi = new sst.aws.Function("MyApi", {
  url: true,
  link: [bucket, auth, neonProject],
  handler: "packages/functions/src/api.handler",
});
