import { auth } from "./auth";
import { neonProject } from "./neon";
import { bucket } from "./storage";

export const myApi = new sst.aws.Function("MyApi", {
  url: true,
  link: [bucket, auth, neonProject],
  handler: "packages/functions/src/api.handler",
});
