import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { SignJWT, jwtVerify } from "jose";
import { Resource } from "sst";
import { getAuth, requireAuth, setTokens } from "./common";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { GitHub } from "@functional-infra/core/github";
import { client } from "../client";
import { getCookie, setCookie } from "hono/cookie";
import type { Challenge } from "@openauthjs/openauth/client";
import { Webhooks } from "@octokit/webhooks";

const app = new Hono().use(getAuth);

app.get("/", (c) => {
  return c.json({
    subject: c.get("subject"),
  });
});

app.get("/auth", async (c) => {
  const redirectURI = c.req.url.replace("/auth", "/auth/callback");
  const { url, challenge } = await client.authorize(redirectURI, "code", {
    provider: "github",
  });
  setCookie(c, "challenge", JSON.stringify(challenge));
  return c.redirect(url);
});

app.get("/auth/callback", async (c) => {
  const error = c.req.query("error");
  if (error) {
    return c.json({ error }, 400);
  }
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }
  const challenge = JSON.parse(getCookie(c, "challenge") ?? "{}") as Challenge;
  if (challenge.state !== state) {
    return c.json({ error: "Invalid state" }, 400);
  }
  const redirectURI = c.req.url.replace(/\?.*$/, "");
  const res = await client.exchange(code, redirectURI, challenge.verifier);
  if (res.err) {
    return c.json({ error: res.err.message }, 400);
  }
  setTokens(c, res.tokens);
  return c.redirect("/");
});

const secret = new TextEncoder().encode(Resource.StateSecret.value);

app.get("/github", requireAuth, async (c) => {
  const installations = await GitHub.installations(
    c.get("subject").properties.defaultTeamId,
  );
  return c.json(installations);
});

app.get("/github/install", requireAuth, async (c) => {
  const state = await new SignJWT({
    teamId: c.get("subject").properties.defaultTeamId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret);
  return c.redirect(
    `https://github.com/apps/functional-dev/installations/new?state=${state}`,
  );
});

app.get(
  "/github/install/callback",
  zValidator(
    "query",
    z
      .object({
        installation_id: z.coerce.number(),
        setup_action: z.literal("install"),
        state: z.string(),
      })
      .transform(async ({ installation_id, setup_action, state }) => {
        const { payload } = await jwtVerify<{ teamId: string }>(state, secret);
        return { installation_id, setup_action, teamId: payload.teamId };
      }),
  ),
  async (c) => {
    const { installation_id, teamId } = c.req.valid("query");
    await GitHub.install(installation_id, teamId);
    return c.redirect("/github");
  },
);

const webhooks = new Webhooks({
  secret: Resource.WebhookSecret.value,
});
webhooks.on("installation.deleted", async (event) => {
  await GitHub.deleteInstallation(event.payload.installation.id.toString());
});
webhooks.onAny(async (event) => {
  console.log(`Received ${event.name} event with id ${event.id}`);
});

app.post(
  "/github/webhook",
  zValidator(
    "header",
    z.object({
      "x-hub-signature-256": z.string(),
      "x-github-event": z.string(),
      "x-github-delivery": z.string(),
    }),
  ),
  async (c) => {
    const headers = c.req.valid("header");
    const payload = await c.req.text();

    try {
      await webhooks.verifyAndReceive({
        id: headers["x-github-delivery"],
        name: headers["x-github-event"],
        signature: headers["x-hub-signature-256"],
        payload,
      });
      return c.text("OK", 200);
    } catch (e) {
      return c.text("Invalid signature", 401);
    }
  },
);

export const handler = handle(app);
