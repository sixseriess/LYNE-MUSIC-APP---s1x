import React, { Component, type ErrorInfo, type ReactNode } from "react";

type State = { error: Error | null };

export default class MobileErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[LYNE Mobile] React startup crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: "100dvh", display: "grid", placeContent: "center", gap: 12, padding: 24, background: "#08090a", color: "#f5f5f5", fontFamily: "system-ui", textAlign: "center" }}>
          <strong style={{ fontSize: 28, letterSpacing: 5 }}>LYNE</strong>
          <h1 style={{ fontSize: 18, margin: 0 }}>LYNE couldn't start</h1>
          <p style={{ color: "#a1a1aa", maxWidth: 320, margin: 0 }}>The mobile app hit an error while loading. Reload to try again.</p>
          <button onClick={() => window.location.reload()} style={{ margin: "12px auto 0", padding: "12px 20px", borderRadius: 10, border: 0, background: "#fff", color: "#111", fontWeight: 600 }}>Reload LYNE</button>
          <small style={{ color: "#71717a", overflowWrap: "anywhere" }}>{this.state.error.message}</small>
        </main>
      );
    }
    return this.props.children;
  }
}
