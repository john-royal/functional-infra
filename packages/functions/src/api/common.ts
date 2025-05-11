import type { SubjectPayload } from "@openauthjs/openauth/subject";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createFactory, createMiddleware } from "hono/factory";
import { client } from "../client";
import { subjects } from "../subjects";
import type { Context } from "hono";
import type { Tokens } from "@openauthjs/openauth/client";

export const setTokens = (c: Context, tokens: Tokens) => {
  setCookie(c, "access", tokens.access);
  setCookie(c, "refresh", tokens.refresh);
};

export const clearTokens = (c: Context) => {
  deleteCookie(c, "access");
  deleteCookie(c, "refresh");
};

export const getAuth = createMiddleware<{
  Variables: { subject?: SubjectPayload<typeof subjects> };
}>(async (c, next) => {
  const access = getCookie(c, "access");
  const refresh = getCookie(c, "refresh");
  if (!access) {
    return next();
  }
  const res = await client.verify(subjects, access, { refresh });
  if (res.err) {
    clearTokens(c);
    return next();
  }
  if (res.tokens) {
    setTokens(c, res.tokens);
  }
  c.set("subject", res.subject);
  return next();
});

export const requireAuth = createMiddleware<{
  Variables: { subject: SubjectPayload<typeof subjects> };
}>(async (c, next) => {
  if (!c.get("subject")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});
