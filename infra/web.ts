import { api } from "./api";
import { auth } from "./auth";

const SESSION_SECRET = new random.RandomPassword("WEB_SESSION_SECRET", {
  length: 32,
});

export const web = new sst.aws.TanStackStart("Web", {
  path: "packages/web",
  link: [auth, api, SESSION_SECRET],
  environment: {
    VITE_ORIGIN: $dev
      ? "http://localhost:3000"
      : "https://d10rhnn0yafwih.cloudfront.net",
    VITE_API_URL: api.url,
  },
});
