import { router } from "@functional-infra/core/trpc";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { logger } from "hono/logger";
import { authRouter } from "./auth";
import { getAuth } from "./common";
import { githubRouter } from "./github";

const app = new Hono()
  .use(getAuth)
  .use(logger())
  .use(
    "/trpc/*",
    trpcServer({
      endpoint: "/trpc",
      router,
      createContext: (_, c) => ({ subject: c.get("subject") }),
    }),
  )
  .route("/auth", authRouter)
  .route("/github", githubRouter);

export const handler = handle(app);
