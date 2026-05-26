import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center">
          <img src={logo} alt="FitExtremes" className="h-20 w-20 object-contain" />
          <div className="space-y-2 max-w-md">
            <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              Please refresh the page or log in again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-xs text-left text-destructive whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="hero" onClick={this.handleReload}>
              Reload App
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/login")}>
              Login
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
