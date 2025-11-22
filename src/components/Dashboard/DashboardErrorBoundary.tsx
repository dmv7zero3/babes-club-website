import { Component, type ErrorInfo, type ReactNode } from "react";

interface DashboardErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Dashboard error boundary caught an error", error, info);
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return (
        fallback ?? (
          <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6 text-center text-sm text-neutral-600">
            <h2 className="text-lg font-semibold text-neutral-900">
              Something went wrong.
            </h2>
            <p className="mt-2 max-w-md">
              {error?.message ??
                "We hit an unexpected error while loading the dashboard."}
            </p>
            <p className="mt-4 text-xs text-neutral-400">
              Refresh the page or contact support if the issue persists.
            </p>
          </div>
        )
      );
    }

    return children;
  }
}

export default DashboardErrorBoundary;
