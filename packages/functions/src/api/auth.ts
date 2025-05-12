import { type Context, Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authClient, setTokens, type Subject } from "./common";

const getRedirectURI = (c: Context) =>
  new URL("/auth/callback", c.req.url).toString();

export const authRouter = new Hono<{
  Variables: { subject: Subject | null };
}>()
  .get("/", (c) => {
    return c.json(c.get("subject"));
  })
  .get("/authorize", async (c) => {
    const redirectURI = getRedirectURI(c);
    const { url, challenge } = await authClient.authorize(redirectURI, "code", {
      provider: "github",
    });
    setCookie(c, "challenge", JSON.stringify(challenge), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return c.redirect(url);
  })
  .get(
    "/callback",
    zValidator(
      "query",
      z.union([
        z.object({
          code: z.string(),
          state: z.string(),
        }),
        z.object({
          error: z.string(),
          error_description: z.string(),
        }),
      ]),
    ),
    zValidator(
      "cookie",
      z.object({
        challenge: z
          .string()
          .transform((challenge) => JSON.parse(challenge))
          .pipe(
            z.object({ state: z.string(), verifier: z.string().optional() }),
          ),
      }),
    ),
    async (c) => {
      const query = c.req.valid("query");
      const cookie = c.req.valid("cookie");

      deleteCookie(c, "challenge");

      if ("error" in query) {
        return c.json(
          { error: query.error, error_description: query.error_description },
          400,
        );
      }

      if (query.state !== cookie.challenge.state) {
        return c.json({ error: "Invalid state" }, 400);
      }

      const res = await authClient.exchange(
        query.code,
        getRedirectURI(c),
        cookie.challenge.verifier,
      );

      if (res.err) {
        return c.json({ error: res.err.message }, 400);
      }

      setTokens(c, res.tokens);

      return c.redirect("/");
    },
  );
