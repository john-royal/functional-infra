import { neonProject } from "./neon";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "./secrets";

export const auth = new sst.aws.Auth("Auth", {
  issuer: {
    handler: "packages/functions/src/auth.handler",
    link: [GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, neonProject],
  },
});
