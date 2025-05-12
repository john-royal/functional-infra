import { Redis } from "@upstash/redis";
import { Resource } from "sst";

export const redis = new Redis({
  url: Resource.Redis.url,
  token: Resource.Redis.token,
});
