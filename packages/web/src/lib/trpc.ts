import { getSubject } from "@/lib/auth";
import type { TRPCRouter } from "@functional-infra/core/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();

export const createQueryClientContext = () => {
  const subject = getSubject();
  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        url: new URL("/trpc", import.meta.env.VITE_API_URL),
        headers: async () => {
          const { accessToken } = await subject;
          if (!accessToken) {
            return {};
          }
          return {
            Authorization: `Bearer ${accessToken}`,
          };
        },
      }),
    ],
  });
  const queryClient = new QueryClient();
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });
  return { trpcClient, queryClient, trpc };
};
