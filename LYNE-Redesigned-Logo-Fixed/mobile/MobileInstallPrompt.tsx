import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "lyne:mobile-install-dismissed:v1";

function isIosDevice(): boolean {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const apple = isIosDevice();
    setIos(apple);
    if (!mobile || isStandalone()) return;

    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {}

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setGuideOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (apple) setVisible(true);
    else window.setTimeout(() => {
      if (!isStandalone()) setVisible(true);
    }, 1800);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setGuideOpen(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
  };

  const install = async () => {
    if (!deferredPrompt) {
      setGuideOpen(true);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") setVisible(false);
    else setGuideOpen(true);
  };

  if (!visible) return null;

  return (
    <>
      <div className="lyne-install-banner" role="region" aria-label="Install LYNE">
        <div className="lyne-install-copy">
          <span className="lyne-install-mark">L</span>
          <span><strong>Take LYNE with you</strong><small>Add LYNE to your home screen</small></span>
        </div>
        <button className="lyne-install-action" type="button" onClick={() => void install()}>
          {deferredPrompt ? "Install" : "Add LYNE"}
        </button>
        <button className="lyne-install-dismiss" type="button" aria-label="Dismiss install prompt" onClick={dismiss}>×</button>
      </div>

      {guideOpen && (
        <div className="lyne-install-scrim" role="presentation" onClick={() => setGuideOpen(false)}>
          <section className="lyne-install-guide" role="dialog" aria-modal="true" aria-labelledby="lyne-install-title" onClick={(event) => event.stopPropagation()}>
            <div className="lyne-install-guide-handle" />
            <div className="lyne-install-guide-brand">LYNE</div>
            <h2 id="lyne-install-title">Add LYNE to your home screen</h2>
            {ios ? (
              <ol>
                <li><span>1</span><div><strong>Tap the Share button</strong><small>At the bottom of Safari, tap the square with the upward arrow.</small></div></li>
                <li><span>2</span><div><strong>Choose “Add to Home Screen”</strong><small>You may need to scroll down in the Share menu.</small></div></li>
                <li><span>3</span><div><strong>Tap Add</strong><small>LYNE will appear beside your other apps.</small></div></li>
              </ol>
            ) : (
              <ol>
                <li><span>1</span><div><strong>Open your browser menu</strong><small>In Chrome, tap the three dots in the top corner.</small></div></li>
                <li><span>2</span><div><strong>Choose “Install app”</strong><small>If that option isn't shown, choose “Add to Home screen”.</small></div></li>
                <li><span>3</span><div><strong>Confirm Install or Add</strong><small>LYNE will appear on your home screen.</small></div></li>
              </ol>
            )}
            <button className="lyne-install-done" type="button" onClick={() => setGuideOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
