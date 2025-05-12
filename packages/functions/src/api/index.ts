import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { authRouter } from "./auth";
import { getAuth } from "./common";
import { githubRouter } from "./github";

const app = new Hono()
  .use(getAuth)
  .route("/auth", authRouter)
  .route("/github", githubRouter);

export const handler = handle(app);
