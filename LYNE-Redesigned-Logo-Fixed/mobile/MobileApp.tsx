import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import {
  AppleEmojiProvider,
  GlobalTooltip,
  RootErrorBoundary,
  ToastProvider,
} from "@/shared/ui";
import { I18nProvider } from "@/languages";
import { CoverSwRegistrar } from "@/features/covers";
import { AuthLock } from "@/features/auth";
import { AppRoutes } from "@/app/routes";
import { initMainWindowServices } from "@/app/mainWindowServices";
import MobileInstallPrompt from "./MobileInstallPrompt";
import "./mobile.css";

let servicesInitialized = false;
if (!servicesInitialized) {
  servicesInitialized = true;
  initMainWindowServices();
}

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
      <CoverSwRegistrar />
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <GlobalTooltip />
        <AppleEmojiProvider>
          <I18nProvider>
            <ToastProvider>
              <RootErrorBoundary>
                <AuthLock>
                  <AppRoutes />
                </AuthLock>
              </RootErrorBoundary>
            </ToastProvider>
          </I18nProvider>
        </AppleEmojiProvider>
        <MobileInstallPrompt />
      </ThemeProvider>
    </HashRouter>
  );
}
