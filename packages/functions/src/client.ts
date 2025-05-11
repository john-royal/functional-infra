import { createClient } from "@openauthjs/openauth/client";
import { Resource } from "sst";

export const client = createClient({
  issuer: Resource.Auth.url,
  clientID: "api",
});
