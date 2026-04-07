import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { queryClient } from "@/lib/query-client";
import { ErrorBoundary } from "@/components/error-boundary";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HashRouter>{children}</HashRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
