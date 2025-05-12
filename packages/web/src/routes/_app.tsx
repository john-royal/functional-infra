import { getSubject } from "@/lib/auth";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: Outlet,
  loader: async ({ context }) => {
    void context.queryClient.prefetchQuery(context.trpc.me.queryOptions());
    const { subject } = await getSubject();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    return {
      subject,
    };
  },
});
