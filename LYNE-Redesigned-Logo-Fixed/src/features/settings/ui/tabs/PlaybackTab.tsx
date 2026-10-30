import { useState, useEffect } from "react";
import { useTranslation } from "@/languages";
import { usePlayerStore } from "@/features/player";
import { ToggleSwitch } from "@/shared/ui";
import { Slider } from "@/shared/ui/Slider";
import { SettingRow, SettingSection, SegmentedControl } from "../controls";

export function PlaybackTab({ searchQuery }: { searchQuery?: string }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const autoplaySimilar = usePlayerStore((state) => state.autoplaySimilar);
  const setAutoplaySimilar = usePlayerStore((state) => state.setAutoplaySimilar);
  const trackDoubleClickBehavior = usePlayerStore((state) => state.trackDoubleClickBehavior);
  const setTrackDoubleClickBehavior = usePlayerStore((state) => state.setTrackDoubleClickBehavior);
  const defaultPlaybackContext = usePlayerStore((state) => state.defaultPlaybackContext);
  const setDefaultPlaybackContext = usePlayerStore((state) => state.setDefaultPlaybackContext);
  const pauseOnDeviceChange = usePlayerStore((state) => state.pauseOnDeviceChange);
  const setPauseOnDeviceChange = usePlayerStore((state) => state.setPauseOnDeviceChange);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SettingSection>
      <SettingRow
        title="Master volume"
        description="Set the overall playback volume"
        searchQuery={searchQuery}
        control={
          <div className="w-[150px]">
            <Slider
              value={Math.round(volume * 100)}
              onChange={(value) => setVolume(value / 100)}
              min={0}
              max={100}
              ariaLabel="Master volume"
              formatValue={(value) => `${value}%`}
            />
          </div>
        }
      />
      <SettingRow
        title={t("settings.autoplay_similar.title")}
        description={t("settings.autoplay_similar.description")}
        titleKey="settings.autoplay_similar.title"
        descKey="settings.autoplay_similar.description"
        searchQuery={searchQuery}
        control={<ToggleSwitch checked={autoplaySimilar} onChange={setAutoplaySimilar} />}
      />
      <SettingRow
        title={t("settings.track_double_click.title")}
        description={t("settings.track_double_click.description")}
        titleKey="settings.track_double_click.title"
        descKey="settings.track_double_click.description"
        searchQuery={searchQuery}
        control={
          mounted ? (
            <SegmentedControl
              ariaLabel={t("settings.track_double_click.title")}
              value={trackDoubleClickBehavior}
              onChange={setTrackDoubleClickBehavior}
              options={[
                { value: "play", label: t("settings.track_double_click.play") },
                { value: "queue", label: t("settings.track_double_click.queue") },
              ]}
            />
          ) : <span />
        }
      />
      <SettingRow
        title={t("settings.default_playback_context.title")}
        description={t("settings.default_playback_context.description")}
        explained
        titleKey="settings.default_playback_context.title"
        descKey="settings.default_playback_context.description"
        searchQuery={searchQuery}
        control={
          mounted ? (
            <SegmentedControl
              ariaLabel={t("settings.default_playback_context.title")}
              value={defaultPlaybackContext}
              onChange={setDefaultPlaybackContext}
              options={[
                { value: "resume", label: t("settings.default_playback_context.resume") },
                { value: "empty", label: t("settings.default_playback_context.empty") },
              ]}
            />
          ) : <span />
        }
      />
      <SettingRow
        title={t("settings.audio.pause_on_device_change.title")}
        description={t("settings.audio.pause_on_device_change.description")}
        titleKey="settings.audio.pause_on_device_change.title"
        descKey="settings.audio.pause_on_device_change.description"
        searchQuery={searchQuery}
        control={<ToggleSwitch checked={pauseOnDeviceChange} onChange={setPauseOnDeviceChange} />}
      />
    </SettingSection>
  );
}
