import { type Challenge, createClient } from "@openauthjs/openauth/client";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Resource } from "sst";
import { subjects } from "./subjects";
import { db, schema } from "@functional-infra/core/db";

const client = createClient({
  issuer: Resource.Auth.url,
  clientID: "api",
});

const app = new Hono<{ Variables: { subject: unknown } }>()
  .use(async (c, next) => {
    const access = getCookie(c, "access");
    const refresh = getCookie(c, "refresh");
    if (access) {
      const res = await client.verify(subjects, access, { refresh });
      if (res.err) {
        deleteCookie(c, "access");
        deleteCookie(c, "refresh");
        return next();
      }
      if (res.tokens) {
        setCookie(c, "access", res.tokens.access);
        setCookie(c, "refresh", res.tokens.refresh);
      }
      c.set("subject", res.subject);
    }
    return next();
  })
  .get("/", async (c) => {
    return c.json({
      subject: c.get("subject"),
      db: await db.select().from(schema.users).limit(1),
    });
  })
  .get("/auth", async (c) => {
    const redirectURI = c.req.url.replace("/auth", "/auth/callback");
    const { url, challenge } = await client.authorize(redirectURI, "code", {
      provider: "github",
    });
    setCookie(c, "challenge", JSON.stringify(challenge));
    return c.redirect(url);
  })
  .get("/auth/callback", async (c) => {
    const error = c.req.query("error");
    if (error) {
      return c.json({ error }, 400);
    }
    const code = c.req.query("code");
    const state = c.req.query("state");
    if (!code || !state) {
      return c.json({ error: "Missing code or state" }, 400);
    }
    const challenge = JSON.parse(
      getCookie(c, "challenge") ?? "{}",
    ) as Challenge;
    if (challenge.state !== state) {
      return c.json({ error: "Invalid state" }, 400);
    }
    const redirectURI = c.req.url.replace(/\?.*$/, "");
    const res = await client.exchange(code, redirectURI, challenge.verifier);
    if (res.err) {
      return c.json({ error: res.err.message }, 400);
    }
    if (res.tokens) {
      setCookie(c, "access", res.tokens.access);
      setCookie(c, "refresh", res.tokens.refresh);
    }
    return c.redirect("/");
  });

export const handler = handle(app);
