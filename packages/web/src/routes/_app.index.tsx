import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc";
import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_app/")({
  component: App,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.githubInstallations.list.queryOptions(),
    );
  },
  pendingComponent: () => <div>Loading...</div>,
});

function App() {
  const trpc = useTRPC();
  const [me, installations] = useSuspenseQueries({
    queries: [
      trpc.me.queryOptions(),
      trpc.githubInstallations.list.queryOptions(),
    ],
  });
  const handleSignOut = useServerFn(signOut);
  return (
    <div>
      {JSON.stringify(
        {
          me: me.data,
          installations: installations.data,
        },
        null,
        2,
      )}
      <Button onClick={() => handleSignOut()}>Sign out</Button>
    </div>
  );
}
