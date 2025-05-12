import { TRPCError, initTRPC } from "@trpc/server";
import type { Subject } from "../auth";

const t = initTRPC.context<{ subject: Subject | null }>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.subject) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { subject: ctx.subject } });
});
