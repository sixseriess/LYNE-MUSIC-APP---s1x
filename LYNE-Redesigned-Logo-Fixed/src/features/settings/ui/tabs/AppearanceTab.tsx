import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useTranslation, LOCALE_OPTIONS } from "@/languages";
import { MenuSelect } from "@/shared/ui";
import { revealThemeChange } from "@/shared/lib";
import { SettingBlock, SettingRow, SettingSection } from "../controls";
import { ThemeCard } from "./ThemeCard";

const BACKGROUND_KEY = "lyne_custom_background_v1";

export function AppearanceTab({ searchQuery }: { searchQuery?: string }) {
  const { t, locale, setLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [background, setBackground] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    try {
      setBackground(localStorage.getItem(BACKGROUND_KEY) || "");
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".app-shell-enter");
    if (!root) return;
    if (background) {
      root.style.backgroundImage = `linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18)), url("${background}")`;
      root.style.backgroundSize = "cover";
      root.style.backgroundPosition = "center";
      root.style.backgroundAttachment = "fixed";
      root.style.backgroundRepeat = "no-repeat";
    } else {
      root.style.backgroundImage = "";
      root.style.backgroundSize = "";
      root.style.backgroundPosition = "";
      root.style.backgroundAttachment = "";
      root.style.backgroundRepeat = "";
    }
  }, [background]);

  const chooseBackground = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onerror = () => window.alert("Couldn't read that image. Try another file.");
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const source = new Image();
      source.onerror = () => window.alert("That image couldn't be opened.");
      source.onload = () => {
        // Resize phone photos before saving so they fit within browser storage limits.
        const maxEdge = 2400;
        const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const optimized = canvas.toDataURL("image/jpeg", 0.86);
        try {
          localStorage.setItem(BACKGROUND_KEY, optimized);
          setBackground(optimized);
        } catch {
          window.alert("Couldn't save that image. Try a smaller image.");
        }
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const resetBackground = () => {
    try { localStorage.removeItem(BACKGROUND_KEY); } catch {}
    const shell = document.querySelector<HTMLElement>(".app-shell-enter");
    if (shell) {
      shell.style.backgroundImage = "";
      shell.style.backgroundSize = "";
      shell.style.backgroundPosition = "";
      shell.style.backgroundAttachment = "";
      shell.style.backgroundRepeat = "";
    }
    setBackground("");
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <SettingSection>
      <SettingRow
        title={t("settings.language.label")}
        description={t("settings.language.description")}
        titleKey="settings.language.label"
        descKey="settings.language.description"
        searchQuery={searchQuery}
        control={
          mounted ? (
            <MenuSelect
              options={LOCALE_OPTIONS}
              value={locale}
              onChange={setLocale}
              className="min-w-[130px]"
              aria-label={t("settings.language.label")}
            />
          ) : <span />
        }
      />

      <SettingBlock
        title={t("settings.theme.title")}
        description={t("settings.theme.description")}
        titleKey="settings.theme.title"
        descKey="settings.theme.description"
        searchQuery={searchQuery}
      >
        {mounted ? (
          <div className="grid grid-cols-3 gap-[10px]">
            {(
              [
                { value: "system", label: t("settings.theme.system") },
                { value: "light", label: t("settings.theme.light") },
                { value: "dark", label: t("settings.theme.dark") },
              ] as const
            ).map((item) => (
              <ThemeCard
                key={item.value}
                mode={item.value}
                label={item.label}
                active={theme === item.value}
                onSelect={(event) =>
                  revealThemeChange(() => setTheme(item.value), {
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
              />
            ))}
          </div>
        ) : null}
      </SettingBlock>

      <SettingBlock
        title="Custom background"
        description="Choose an image to use behind the app. It stays saved on this device."
        searchQuery={searchQuery}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => chooseBackground(event.target.files?.[0])}
        />
        {background ? (
          <div className="mb-[2px] h-[112px] w-full overflow-hidden rounded-[10px] border border-black/10 dark:border-white/10" aria-label="Custom background preview">
            <img src={background} alt="Selected background preview" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="h-[36px] rounded-[10px] bg-text-primary px-[14px] text-[12px] font-[600] text-bg-primary"
          >
            {background ? "Change image" : "Choose image"}
          </button>
          {background ? (
            <button
              type="button"
              onClick={resetBackground}
              className="h-[36px] rounded-[10px] bg-black/[0.07] px-[14px] text-[12px] font-[500] text-text-primary dark:bg-white/[0.1]"
            >
              Remove background
            </button>
          ) : null}
          {background ? <span className="text-[11px] text-text-tertiary">Custom image applied</span> : null}
        </div>
      </SettingBlock>
    </SettingSection>
  );
}
