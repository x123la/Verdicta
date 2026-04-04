import type { PropsWithChildren } from "react";
import { Component } from "react";

export class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="max-w-lg rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-panel">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Verdicta</div>
            <h1 className="mt-3 text-2xl font-semibold">The workspace hit an unexpected error.</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Restart the app or reopen the workspace. Provider secrets and local documents remain isolated in the main process.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
