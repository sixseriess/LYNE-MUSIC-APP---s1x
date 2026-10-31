import { useEffect, useState } from "react";

interface InstallChoice {
  outcome: "accepted" | "dismissed";
  platform?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

const DISMISS_KEY = "lyne_pwa_install_dismissed_v1";

function isInstalled(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!__LYNE_PWA__ || isInstalled()) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // Storage can be unavailable in private browsing.
    }

    const ua = navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));
    setVisible(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!__LYNE_PWA__ || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Dismissal is best-effort only.
    }
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") dismiss();
  };

  return (
    <div className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+62px)] z-[110] mx-auto max-w-[440px] rounded-2xl border border-white/10 bg-[#151719]/95 p-4 text-white shadow-2xl backdrop-blur-2xl sm:hidden">
      <div className="flex items-start gap-3">
        <img
          src={`${import.meta.env.BASE_URL}icon.png`}
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-semibold">Add LYNE to your Home Screen</p>
          {isIos ? (
            <p className="mb-0 mt-1 text-xs leading-relaxed text-white/65">
              Tap Share in Safari, then choose “Add to Home Screen”.
            </p>
          ) : installEvent ? (
            <p className="mb-0 mt-1 text-xs leading-relaxed text-white/65">
              Install LYNE for a full-screen app experience.
            </p>
          ) : (
            <p className="mb-0 mt-1 text-xs leading-relaxed text-white/65">
              Open your browser menu and choose “Install app” or “Add to Home Screen”.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {installEvent ? (
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-lg bg-[#c8f56a] px-3 py-2 text-xs font-semibold text-[#141414]"
              >
                Install LYNE
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80"
            >
              Got it
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss install instructions"
          onClick={dismiss}
          className="shrink-0 border-0 bg-transparent p-1 text-white/55"
        >
          ×
        </button>
      </div>
    </div>
  );
}
