import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ReBass crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The studio hit an unexpected snag. Reloading usually fixes it — your
            audio never left your device.
          </p>
          {this.state.message && (
            <p className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {this.state.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neon-violet px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-neon-violet/90"
          >
            <RotateCcw className="h-4 w-4" /> Reload ReBass
          </button>
        </div>
      </div>
    );
  }
}