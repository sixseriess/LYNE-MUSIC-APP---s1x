import { useEffect } from "react";
import React from "react";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GlobalTooltip, RootErrorBoundary, ToastProvider } from "@/shared/ui";
import { I18nProvider } from "@/languages";
import MobileAuthGate from "./MobileAuthGate";
import MobileInstallPrompt from "./MobileInstallPrompt";
import "./mobile.css";

export default function MobileApp() {
  useEffect(() => {
    document.body.classList.add("mobile-pwa");
    document.documentElement.classList.add("mobile-pwa");
    return () => {
      document.body.classList.remove("mobile-pwa");
      document.documentElement.classList.remove("mobile-pwa");
    };
  }, []);

  return (
    <HashRouter>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <GlobalTooltip />
        <I18nProvider>
          <ToastProvider>
            <RootErrorBoundary>
              <MobileAuthGate />
            </RootErrorBoundary>
          </ToastProvider>
        </I18nProvider>
        <MobileInstallPrompt />
      </ThemeProvider>
    </HashRouter>
  );
}
