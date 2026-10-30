import { GithubFill } from "@mingcute/react";
import { useTranslation } from "@/languages";

const REPOSITORY_URL = "https://github.com/sixseriess/LYNE-MUSIC-APP---s1x";

export function AboutTabLinks() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-[8px]">
      <button
        type="button"
        onClick={() => window.open(REPOSITORY_URL, "_blank", "noopener,noreferrer")}
        className="flex h-[38px] items-center gap-[8px] rounded-[11px] border-0 bg-black/[0.05] px-[14px] text-[14px] font-[500] text-text-primary transition-colors hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
      >
        <GithubFill size={17} />
        {t("settings.about.github")}
      </button>
    </div>
  );
}
