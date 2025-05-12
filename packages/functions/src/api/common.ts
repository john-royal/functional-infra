import { subjects } from "@functional-infra/core/auth";
import type { Tokens } from "@openauthjs/openauth/client";
import { createClient } from "@openauthjs/openauth/client";
import type { SubjectPayload } from "@openauthjs/openauth/subject";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { Resource } from "sst";

export const authClient = createClient({
  issuer: Resource.Auth.url,
  clientID: "api",
});
export type Subject = SubjectPayload<typeof subjects>;

const getTokens = (c: Context) => {
  return {
    access:
      getCookie(c, "access") ?? c.req.header("Authorization")?.split(" ")[1],
    refresh: getCookie(c, "refresh"),
  };
};

const validateTokens = async (c: Context) => {
  const { access, refresh } = getTokens(c);
  if (!access && !refresh) {
    return null;
  }
  const res = await authClient.verify(subjects, access ?? "", { refresh });
  if (res.err) {
    clearTokens(c);
    return null;
  }
  if (res.tokens) {
    setTokens(c, res.tokens);
  }
  return res.subject;
};

export const setTokens = (c: Context, tokens: Tokens) => {
  setCookie(c, "access", tokens.access, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  setCookie(c, "refresh", tokens.refresh, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
};

export const clearTokens = (c: Context) => {
  deleteCookie(c, "access");
  deleteCookie(c, "refresh");
};

export const getAuth = createMiddleware<{
  Variables: { subject: Subject | null };
}>(async (c, next) => {
  const subject = await validateTokens(c);
  c.set("subject", subject);
  return next();
});

export const requireAuth = createMiddleware<{
  Variables: { subject: Subject };
}>(async (c, next) => {
  if (!c.get("subject")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});
