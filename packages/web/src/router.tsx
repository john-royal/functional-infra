import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import { routeTree } from "./routeTree.gen";

import { TRPCProvider, createQueryClientContext } from "./lib/trpc";
import "./styles.css";

export function createRouter() {
  const { queryClient, trpc, trpcClient } = createQueryClientContext();
  const router = routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      context: {
        queryClient,
        trpc,
      },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      Wrap: ({ children }) => (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
        </TRPCProvider>
      ),
    }),
    queryClient,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
