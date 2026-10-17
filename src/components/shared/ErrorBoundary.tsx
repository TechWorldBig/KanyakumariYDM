import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application rendering error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="app-error" role="alert">
        <div className="app-error-card">
          <span className="eyebrow">District OS</span>
          <h1>We couldn’t load this workspace.</h1>
          <p>Refresh the page to reconnect to your secure workspace. Your saved data is safe.</p>
          <button className="primary" onClick={() => window.location.reload()}>Refresh workspace</button>
        </div>
      </main>
    );
  }
}
