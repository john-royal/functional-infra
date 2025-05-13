import { GithubInstallation } from "@functional-infra/core/github-installation";
import { sValidator } from "@hono/standard-validator";
import { Webhooks } from "@octokit/webhooks";
import { Hono } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { Resource } from "sst";
import { z } from "zod";
import { requireAuth } from "./common";
import { TeamMember } from "@functional-infra/core/team";
import { Project } from "@functional-infra/core/project";
import { Deployment } from "@functional-infra/core/deployment";
import { Environment } from "@functional-infra/core/environment";

const webhooks = new Webhooks({
  secret: Resource.GITHUB_WEBHOOK_SECRET.value,
});
const jwtSecret = new TextEncoder().encode(Resource.GITHUB_STATE_SECRET.value);

webhooks.on("installation.deleted", async (event) => {
  await GithubInstallation.del(event.payload.installation.id.toString());
});

webhooks.on("push", async (event) => {
  const project = await Project.byRepositoryId(event.payload.repository.id);
  if (project) {
    const environment = await Environment.find(
      project.id,
      event.payload.ref === `refs/heads/${project.gitProductionBranch}`,
    );
    await Deployment.create({
      projectId: project.id,
      status: "queued",
      gitCommitAuthor: event.payload.head_commit?.author.name,
      gitCommitAuthorEmail: event.payload.head_commit?.author.email,
      gitCommitHash: event.payload.head_commit?.id,
      gitCommitMessage: event.payload.head_commit?.message,
      gitCommitDate: event.payload.head_commit?.timestamp
        ? new Date(event.payload.head_commit.timestamp)
        : undefined,
      environmentId: environment.id,
      trigger: "push",
    });
  }
});

export const githubRouter = new Hono()
  .get("/install/:teamId", requireAuth, async (c) => {
    const teamId = c.req.param("teamId");
    await TeamMember.assert(c.get("subject").properties.id, teamId);
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
