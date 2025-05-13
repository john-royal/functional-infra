import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/lib/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/$team/$project")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.project.get.queryOptions(params),
    );
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.project.get.queryOptions(params));
  return <div>{JSON.stringify(data, null, 2)}</div>;
}
