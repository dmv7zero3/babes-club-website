import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useDashboardAuth } from './DashboardRouteGuard';

interface DashboardErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
}

const DashboardErrorFallback = ({ error, onRetry }: DashboardErrorFallbackProps) => {
  const { logout } = useDashboardAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-rose-100">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Unable to Load Dashboard
          </h2>
          <p className="text-sm text-neutral-600">
            {error?.message || 'An unexpected error occurred while loading your dashboard'}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition rounded-full shadow-md bg-cotton-candy text-neutral-900 hover:bg-babe-pink/80"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition border-2 rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          If the problem persists, please contact{' '}
          <a
            href="mailto:support@thebabesclub.com"
            className="text-cotton-candy hover:underline"
          >
            support@thebabesclub.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default DashboardErrorFallback;
