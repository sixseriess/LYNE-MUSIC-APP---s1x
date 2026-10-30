import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "@/languages";
import { playerRuntime, usePlayerStore } from "@/features/player";
import { ToggleSwitch } from "@/shared/ui";
import { Slider } from "@/shared/ui/Slider";
import { SettingRow, SettingSection, SegmentedControl } from "../controls";

export function PlaybackTab({ searchQuery }: { searchQuery?: string }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [audioOutputs, setAudioOutputs] = useState<Array<{ deviceId: string; label: string }>>([{ deviceId: "default", label: "System default" }]);
  const [outputSupported, setOutputSupported] = useState(false);
  const [outputError, setOutputError] = useState("");
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const audioQuality = usePlayerStore((state) => state.audioQuality);
  const setAudioQuality = usePlayerStore((state) => state.setAudioQuality);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const setPlaybackRate = usePlayerStore((state) => state.setPlaybackRate);
  const autoplaySimilar = usePlayerStore((state) => state.autoplaySimilar);
  const setAutoplaySimilar = usePlayerStore((state) => state.setAutoplaySimilar);
  const trackDoubleClickBehavior = usePlayerStore((state) => state.trackDoubleClickBehavior);
  const setTrackDoubleClickBehavior = usePlayerStore((state) => state.setTrackDoubleClickBehavior);
  const defaultPlaybackContext = usePlayerStore((state) => state.defaultPlaybackContext);
  const setDefaultPlaybackContext = usePlayerStore((state) => state.setDefaultPlaybackContext);
  const outputDeviceId = usePlayerStore((state) => state.outputDeviceId);
  const setOutputDeviceId = usePlayerStore((state) => state.setOutputDeviceId);
  const pauseOnDeviceChange = usePlayerStore((state) => state.pauseOnDeviceChange);
  const setPauseOnDeviceChange = usePlayerStore((state) => state.setPauseOnDeviceChange);

  useEffect(() => {
    setMounted(true);
    let active = true;
    const mediaDevices = navigator.mediaDevices;
    const refreshOutputs = async () => {
      setOutputSupported(Boolean(playerRuntime?.supportsAudioOutputSelection()));
      if (!mediaDevices?.enumerateDevices) return;
      try {
        const devices = await mediaDevices.enumerateDevices();
        if (!active) return;
        const unique = new Map<string, string>();
        unique.set("default", "System default");
        for (const device of devices) {
          if (device.kind !== "audiooutput" || !device.deviceId || device.deviceId === "default") continue;
          unique.set(device.deviceId, device.label || "Audio output");
        }
        setAudioOutputs(Array.from(unique, ([deviceId, label]) => ({ deviceId, label })));
      } catch {
        if (active) setAudioOutputs([{ deviceId: "default", label: "System default" }]);
      }
    };
    void refreshOutputs();
    mediaDevices?.addEventListener?.("devicechange", refreshOutputs);
    return () => {
      active = false;
      mediaDevices?.removeEventListener?.("devicechange", refreshOutputs);
    };
  }, []);

  const handleOutputChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.currentTarget.value;
    setOutputError("");
    const runtime = playerRuntime;
    if (!runtime) {
      setOutputError("Audio playback is not initialized yet.");
      return;
    }
    try {
      await runtime.setAudioOutputDevice(deviceId);
      setOutputDeviceId(deviceId);
    } catch (error) {
      setOutputError(error instanceof Error ? error.message : "Couldn't change audio output.");
    }
  };

  return (
    <SettingSection>
      <SettingRow
        title="Master volume"
        description="Set the overall playback volume"
        searchQuery={searchQuery}
        control={
          <div className="w-[180px]">
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
        title="Playback speed"
        description="Adjust the speed of the current and future tracks"
        searchQuery={searchQuery}
        control={
          <div className="w-[180px]">
            <Slider
              value={Math.round(playbackRate * 100)}
              onChange={(value) => setPlaybackRate(value / 100)}
              min={50}
              max={200}
              step={5}
              ariaLabel="Playback speed"
              formatValue={(value) => `${(value / 100).toFixed(2)}×`}
            />
          </div>
        }
      />
      <SettingRow
        title="Audio quality"
        description="Choose the stream quality for new tracks. Lossless uses a true lossless source when one is available; otherwise LYNE picks the highest available quality."
        searchQuery={searchQuery}
        control={
          mounted ? (
            <SegmentedControl
              ariaLabel="Audio quality"
              value={audioQuality}
              onChange={setAudioQuality}
              options={[
                { value: "low", label: "Low" },
                { value: "standard", label: "Normal" },
                { value: "high", label: "High" },
                { value: "lossless", label: "Lossless" },
              ]}
            />
          ) : <span />
        }
      />
      <SettingRow
        title="Output device"
        description="Choose which audio device LYNE sends playback to."
        searchQuery={searchQuery}
        control={
          outputSupported ? (
            <div className="flex w-[210px] flex-col gap-[5px]">
              <select
                aria-label="Audio output device"
                value={outputDeviceId}
                onChange={handleOutputChange}
                className="h-[36px] w-full rounded-[9px] border border-black/10 bg-white/70 px-[10px] text-[12px] text-text-primary outline-none dark:border-white/10 dark:bg-white/[0.07]"
              >
                {audioOutputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
                {!audioOutputs.some((device) => device.deviceId === outputDeviceId) && (
                  <option value={outputDeviceId}>Saved device (unavailable)</option>
                )}
              </select>
              {outputError ? <span className="text-[11px] text-red-500">{outputError}</span> : null}
            </div>
          ) : (
            <span className="text-[12px] text-text-tertiary">Not supported</span>
          )
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
