import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FeedErrorBoundary] Caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Unable to load feed
          </h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while loading your feed. Please try again.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs text-left text-destructive whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
              {this.state.error.message}
            </pre>
          )}
          <Button variant="hero" onClick={this.handleRetry}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default FeedErrorBoundary;
