import { describe, expect, it } from "vitest";
import { selectBestAudioFormat, type AudioFormat } from "./innertubeAudioFormats";

const formats: AudioFormat[] = [
  { itag: 139, url: "low", mimeType: "audio/mp4", bitrate: 48_000 },
  { itag: 140, url: "standard", mimeType: "audio/mp4", bitrate: 128_000 },
  { itag: 251, url: "high", mimeType: "audio/webm; codecs=\"opus\"", bitrate: 160_000 },
  { itag: 141, url: "highest", mimeType: "audio/mp4", bitrate: 256_000 },
];

describe("selectBestAudioFormat quality preference", () => {
  it("selects the lowest available bitrate for Low", () => {
    expect(selectBestAudioFormat(formats, undefined, "low")?.url).toBe("low");
  });

  it("selects the format closest to 128 kbps for Standard", () => {
    expect(selectBestAudioFormat(formats, undefined, "standard")?.url).toBe("standard");
  });

  it("selects the highest available bitrate for High", () => {
    expect(selectBestAudioFormat(formats, undefined, "high")?.url).toBe("highest");
  });

  it("honors the preferred codec before comparing bitrate", () => {
    expect(selectBestAudioFormat(formats, "opus", "high")?.url).toBe("high");
  });

  it("selects a true lossless format when the source provides one", () => {
    const withLossless: AudioFormat[] = [
      ...formats,
      { itag: 999, url: "flac", mimeType: "audio/flac", bitrate: 900_000 },
    ];
    expect(selectBestAudioFormat(withLossless, "opus", "lossless")?.url).toBe("flac");
  });

  it("uses the highest available stream when no lossless source exists", () => {
    expect(selectBestAudioFormat(formats, undefined, "lossless")?.url).toBe("highest");
  });
});
