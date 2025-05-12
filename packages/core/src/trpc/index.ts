import { User } from "../example";
import { GithubInstallation } from "../github-installation";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "./trpc";
import { z } from "zod";

export const router = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) =>
    User.byId(ctx.subject.properties.id),
  ),
  githubInstallations: {
    list: protectedProcedure.query(({ ctx }) =>
      GithubInstallation.list(ctx.subject.properties.defaultTeamId),
    ),

    listRepositories: protectedProcedure
      .input(z.object({ installationId: z.string() }))
      .query(({ ctx, input }) => {
        return GithubInstallation.listRepositories(
          input.installationId,
          ctx.subject.properties.defaultTeamId,
        );
      }),
  },
});

export type TRPCRouter = typeof router;
