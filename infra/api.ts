import { auth } from "./auth";
import { neonProject } from "./neon";
import { redis } from "./redis";
import {
  GITHUB_APP_ID,
  GITHUB_PRIVATE_KEY,
  GITHUB_STATE_SECRET,
  GITHUB_WEBHOOK_SECRET,
} from "./secrets";
import { bucket } from "./storage";

export const deployQueue = new sst.aws.Queue("DeployQueue");

export const api = new sst.aws.Function("MyApi", {
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
    deployQueue,
  ],
  handler: "packages/functions/src/api/index.handler",
});
