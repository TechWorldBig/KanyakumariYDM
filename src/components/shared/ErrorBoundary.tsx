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
      <main
        className="app-error min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#090e1a',
          color: '#f8fafc',
        }}
        role="alert"
      >
        <div
          className="app-error-card max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4"
          style={{
            maxWidth: '460px',
            width: '100%',
            padding: '2rem 1.75rem',
            borderRadius: '1.25rem',
            background: '#111a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}
        >
          <span
            className="eyebrow inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(37,99,235,0.15)',
              color: '#93c5fd',
              marginBottom: '0.75rem',
            }}
          >
            District OS
          </span>
          <h1
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}
          >
            We couldn’t load this workspace.
          </h1>
          <p
            className="text-xs sm:text-sm text-slate-600 dark:text-slate-400"
            style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.25rem' }}
          >
            Refresh the page to reconnect to your secure workspace. Your saved data is safe.
          </p>

          {this.state.error && (
            <div
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-mono text-left overflow-x-auto max-h-32"
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.25)',
                color: '#fda4af',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.25rem',
                fontFamily: 'monospace',
              }}
            >
              <strong style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', fontFamily: 'sans-serif' }}>
                Diagnostic Detail:
              </strong>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2"
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}
          >
            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Refresh workspace
            </Button>
            <Button
              variant="outline"
              onClick={this.handleReset}
              className="w-full sm:w-auto text-xs"
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Reset & Return to Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }
}
