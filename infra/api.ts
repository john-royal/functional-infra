import { auth } from "./auth";
import { neonProject } from "./neon";
import { bucket } from "./storage";
import {
  GITHUB_PRIVATE_KEY,
  GITHUB_APP_ID,
  GITHUB_WEBHOOK_SECRET,
  GITHUB_STATE_SECRET,
} from "./secrets";
import { redis } from "./redis";

export const myApi = new sst.aws.Function("MyApi", {
  url: true,
  link: [
    bucket,
    auth,
    neonProject,
    GITHUB_PRIVATE_KEY,
    GITHUB_APP_ID,
    GITHUB_WEBHOOK_SECRET,
    GITHUB_STATE_SECRET,
    redis,
  ],
  handler: "packages/functions/src/api/index.handler",
});
