import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from '../ui/button';

type Props = { children: ReactNode };
type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering error:", error, info.componentStack);
    this.setState({ errorInfo: info });
  }

  handleReset = () => {
    try {
      localStorage.removeItem('district-nav-state');
      sessionStorage.clear();
      // Clear session cookie if corrupted
      document.cookie = 'district_session=; Max-Age=0; path=/';
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="app-error min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950" role="alert">
        <div className="app-error-card max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <span className="eyebrow inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            District OS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            We couldn’t load this workspace.
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Refresh the page to reconnect to your secure workspace. Your saved data is safe.
          </p>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-mono text-left overflow-x-auto max-h-32">
              <strong className="block font-sans font-semibold text-[11px] mb-1">Diagnostic Detail:</strong>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
              Refresh workspace
            </Button>
            <Button variant="outline" onClick={this.handleReset} className="w-full sm:w-auto text-xs">
              Reset & Return to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }
}
