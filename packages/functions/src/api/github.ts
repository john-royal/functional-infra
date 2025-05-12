import { GithubInstallation } from "@functional-infra/core/github-installation";
import { sValidator } from "@hono/standard-validator";
import { Webhooks } from "@octokit/webhooks";
import { Hono } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { Resource } from "sst";
import { z } from "zod";
import { requireAuth } from "./common";

const webhooks = new Webhooks({
  secret: Resource.GITHUB_WEBHOOK_SECRET.value,
});
const jwtSecret = new TextEncoder().encode(Resource.GITHUB_STATE_SECRET.value);

webhooks.on("installation.deleted", async (event) => {
  await GithubInstallation.del(event.payload.installation.id.toString());
});

export const githubRouter = new Hono()
  .get("/installations", requireAuth, async (c) => {
    const teamId = c.get("subject").properties.defaultTeamId;
    const installations = await GithubInstallation.list(teamId);
    return c.json(installations);
  })
  .get("/installations/:installationId", requireAuth, async (c) => {
    const installationId = c.req.param("installationId");
    const installation = await GithubInstallation.get(
      installationId,
      c.get("subject").properties.defaultTeamId,
    );
    return c.json(installation);
  })
  .get(
    "/installations/:installationId/repositories",
    requireAuth,
    async (c) => {
      const installationId = c.req.param("installationId");
      const repositories = await GithubInstallation.listRepositories(
        installationId,
        c.get("subject").properties.defaultTeamId,
      );
      return c.json(repositories);
    },
  )
  .get("/install", requireAuth, async (c) => {
    const teamId = c.get("subject").properties.defaultTeamId;
    const state = await new SignJWT({
      teamId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(jwtSecret);
    return c.redirect(
      `https://github.com/apps/functional-dev/installations/new?state=${state}`,
    );
  })
  .get(
    "/install/callback",
    sValidator(
      "query",
      z
        .object({
          installation_id: z.coerce.number(),
          setup_action: z.literal("install"),
          state: z.string(),
        })
        .transform(async ({ installation_id, setup_action, state }) => {
          const { payload } = await jwtVerify<{ teamId: string }>(
            state,
            jwtSecret,
          );
          return { installation_id, setup_action, teamId: payload.teamId };
        }),
    ),
    async (c) => {
      const { installation_id, teamId } = c.req.valid("query");
      await GithubInstallation.create(installation_id, teamId);
      return c.redirect("/github");
    },
  )
  .post(
    "/webhook",
    sValidator(
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
