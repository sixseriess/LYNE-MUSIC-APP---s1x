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
import { AuthLock } from "@/features/auth";
import { AppRoutes } from "@/app/routes";
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
