import { auth } from "./auth";
import { neonProject } from "./neon";
import { bucket } from "./storage";

sst.Linkable.wrap(random.RandomPassword, (resource) => ({
  properties: {
    value: $util.secret(resource.result),
  },
}));

const stateSecret = new random.RandomPassword("StateSecret", {
  length: 32,
});

const webhookSecret = new random.RandomPassword("WebhookSecret", {
  length: 64,
});

export const myApi = new sst.aws.Function("MyApi", {
  url: true,
  link: [
    bucket,
    auth,
    neonProject,
    stateSecret,
    webhookSecret,
    new sst.Secret("GITHUB_PRIVATE_KEY"),
    new sst.Secret("GITHUB_APP_ID"),
  ],
  handler: "packages/functions/src/api/index.handler",
});
