import { Button } from "@/components/ui/button";
import { getSubject, signOut } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { subject } = await getSubject();
    if (!subject) {
      throw redirect({ to: "/auth" });
    }
    return { subject };
  },
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(context.trpc.me.queryOptions());
  },
});

function RouteComponent() {
  const handleSignOut = useServerFn(signOut);
  return (
    <div className="flex h-screen w-screen">
      <div className="w-64">
        <Suspense fallback={<div>Loading...</div>}>
          <User />
        </Suspense>
        <Button type="button" onClick={() => handleSignOut()}>
          Sign out
        </Button>
      </div>
      <Outlet />
    </div>
  );
}

function User() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.me.queryOptions());
  return <div>{JSON.stringify(data, null, 2)}</div>;
}
