import { useEffect } from "react";
import React from "react";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import GlobalTooltip from "@/shared/ui/GlobalTooltip";
import { ToastProvider } from "@/shared/ui/Toast";
import { I18nProvider } from "@/languages";
import MobileAuthGate from "./MobileAuthGate";
import MobileInstallPrompt from "./MobileInstallPrompt";
import MobileErrorBoundary from "./MobileErrorBoundary";
import "./mobile.css";

export default function MobileApp() {
  useEffect(() => {
    document.body.classList.add("mobile-pwa");
    document.documentElement.classList.add("mobile-pwa");

    const reportError = (event: ErrorEvent) => {
      console.error("[LYNE Mobile] Unhandled error:", event.message, event.error);
    };
    const reportRejection = (event: PromiseRejectionEvent) => {
      console.error("[LYNE Mobile] Unhandled promise rejection:", event.reason);
    };
    window.addEventListener("error", reportError);
    window.addEventListener("unhandledrejection", reportRejection);

    return () => {
      document.body.classList.remove("mobile-pwa");
      document.documentElement.classList.remove("mobile-pwa");
      window.removeEventListener("error", reportError);
      window.removeEventListener("unhandledrejection", reportRejection);
    };
  }, []);

  return (
    <HashRouter>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <GlobalTooltip />
        <I18nProvider>
          <ToastProvider>
            <MobileErrorBoundary>
              <MobileAuthGate />
            </MobileErrorBoundary>
          </ToastProvider>
        </I18nProvider>
        <MobileInstallPrompt />
      </ThemeProvider>
    </HashRouter>
  );
}
