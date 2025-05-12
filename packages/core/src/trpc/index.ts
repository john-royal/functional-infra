import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, db, eq, getTableColumns, schema } from "../db";
import { Team, User } from "../example";
import { GithubInstallation } from "../github-installation";
import { Project } from "../project";
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
          .select(getTableColumns(schema.teams))
          .from(schema.teams)
          .where(eq(schema.teams.slug, input.slug))
          .limit(1);
        const [memberCount, projects] = await Promise.all([
          db.$count(
            db
              .select()
              .from(schema.teamMembers)
              .where(
                and(
                  eq(schema.teamMembers.teamId, team.id),
                  eq(schema.teamMembers.userId, ctx.subject.properties.id),
                ),
              ),
          ),
          Project.list(team.id),
        ]);
        if (memberCount === 0) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        return { team, projects };
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
