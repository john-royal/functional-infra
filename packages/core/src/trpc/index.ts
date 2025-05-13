import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db, eq, schema } from "../db";
import { User } from "../example";
import { GithubInstallation } from "../github-installation";
import { Project } from "../project";
import { Team, TeamMember } from "../team";
import { createTRPCRouter, protectedProcedure } from "./trpc";

export const router = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) =>
    User.byId(ctx.subject.properties.id),
  ),

  team: {
    list: protectedProcedure.query(({ ctx }) =>
      Team.list(ctx.subject.properties.id),
    ),

    bySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const [team] = await db
          .select()
          .from(schema.teams)
          .where(eq(schema.teams.slug, input.slug))
          .limit(1);
        const [projects] = await Promise.all([
          Project.list(team.id),
          TeamMember.assert(ctx.subject.properties.id, team.id),
        ]);
        return { team, projects };
      }),
  },

  project: {
    get: protectedProcedure
      .input(z.object({ project: z.string() }))
      .query(async ({ ctx, input }) => {
        const [project] = await db
          .select()
          .from(schema.projects)
          .where(eq(schema.projects.slug, input.project))
          .limit(1);
        await TeamMember.assert(ctx.subject.properties.id, project.teamId);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return project;
      }),

    create: protectedProcedure
      .input(
        z.object({
          githubInstallationId: z.string(),
          githubRepositoryId: z.number(),
          githubRepositoryName: z.string(),
          teamId: z.string(),
          name: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await TeamMember.assert(ctx.subject.properties.id, input.teamId);
        const projectId = await Project.create({
          name: input.name,
          slug: input.name.toLowerCase().replace(/\s+/g, "-"),
          teamId: input.teamId,
          githubInstallationId: input.githubInstallationId,
          githubRepositoryId: input.githubRepositoryId,
          githubRepositoryName: input.githubRepositoryName,
        });
        return projectId;
      }),
  },

  githubInstallations: {
    list: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(({ input }) => GithubInstallation.list(input.teamId)),

    listRepositories: protectedProcedure
      .input(z.object({ installationId: z.string(), teamId: z.string() }))
      .query(({ input }) =>
        GithubInstallation.listRepositories(input.installationId, input.teamId),
      ),
  },
});

export type TRPCRouter = typeof router;
