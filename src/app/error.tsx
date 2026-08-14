"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HireMind UI Error Boundary caught]:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-destructive">HireMind Runtime Caught An Error</h2>
      <pre className="mt-4 max-w-2xl overflow-auto rounded bg-secondary/60 p-4 text-left text-xs text-muted-foreground font-mono">
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <div className="mt-6 flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}
