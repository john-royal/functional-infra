import { neonProject } from "./neon";

export const auth = new sst.aws.Auth("Auth", {
  issuer: {
    handler: "packages/functions/src/auth.handler",
    link: [
      new sst.Secret("GITHUB_CLIENT_ID"),
      new sst.Secret("GITHUB_CLIENT_SECRET"),
      neonProject,
    ],
  },
});
