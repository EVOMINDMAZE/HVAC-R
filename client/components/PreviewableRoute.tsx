import { Suspense } from "react";

import PageLoading from "@/components/ui/page-loading";
import { useAuth } from "@/hooks/useSupabaseAuth";

interface PreviewableRouteProps {
  toolComponent: React.ReactNode;
  previewComponent: React.ReactNode;
}

export function PreviewableRoute({ toolComponent, previewComponent }: PreviewableRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  // If logged in, show the real tool. If logged out, show the mock page.
  return (
    <Suspense fallback={<PageLoading />}>
      {isAuthenticated ? toolComponent : previewComponent}
    </Suspense>
  );
}
