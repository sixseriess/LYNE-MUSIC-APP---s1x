import { asArray, asRecord } from "@/shared/utils/json";

export interface AudioFormat {
  itag: number;
  url: string;
  mimeType: string;
  bitrate: number;
  contentLength?: number;
  signatureCipher?: string;
}

export interface ResolvedAudioStream {
  url: string;
  mimeType: string;
  codec: "opus" | "aac";
  bitrate: number;
  itag: number;
  expiresAt: string | null;
  contentLength?: number;
}

const PREFERRED_ITAGS = [251, 140, 250, 249, 139];

export type StreamAudioQuality = "low" | "standard" | "high";

function toAudioFormat(raw: unknown): AudioFormat | null {
  const format = asRecord(raw);
  if (!format) return null;
  const { itag, mimeType } = format;
  const url = typeof format.url === "string" ? format.url : "";
  const signatureCipher =
    typeof format.signatureCipher === "string"
      ? format.signatureCipher
      : undefined;
  if (
    typeof itag !== "number" ||
    typeof mimeType !== "string" ||
    (!url && !signatureCipher)
  )
    return null;
  if (!mimeType.startsWith("audio/")) return null;
  const bitrate =
    typeof format.bitrate === "number"
      ? format.bitrate
      : Number(format.averageBitrate) || 0;
  const contentLength = Number(format.contentLength);
  return {
    itag,
    url,
    mimeType,
    bitrate,
    ...(Number.isFinite(contentLength) && contentLength > 0
      ? { contentLength }
      : {}),
    ...(signatureCipher ? { signatureCipher } : {}),
  };
}

export function extractAudioFormats(playerResponse: unknown): AudioFormat[] {
  const streamingData = asRecord(asRecord(playerResponse)?.streamingData);
  return asArray(streamingData?.adaptiveFormats)
    .map(toAudioFormat)
    .filter((format): format is AudioFormat => Boolean(format));
}

export function selectBestAudioFormat(
  formats: AudioFormat[],
  preferredCodec?: "opus" | "aac",
  quality: StreamAudioQuality = "high",
): AudioFormat | null {
  if (formats.length === 0) return null;

  const codecFormats = preferredCodec
    ? formats.filter((format) =>
        preferredCodec === "opus"
          ? format.mimeType.includes("opus") || format.mimeType.includes("webm")
          : format.mimeType.includes("mp4") || format.mimeType.includes("aac"),
      )
    : formats;
  const candidates = codecFormats.length > 0 ? codecFormats : formats;
  const withBitrate = candidates.filter(
    (format) => Number.isFinite(format.bitrate) && format.bitrate > 0,
  );

  if (withBitrate.length > 0 && quality === "low") {
    return [...withBitrate].sort((a, b) => a.bitrate - b.bitrate)[0] ?? null;
  }
  if (withBitrate.length > 0 && quality === "standard") {
    return (
      [...withBitrate].sort(
        (a, b) =>
          Math.abs(a.bitrate - 128_000) - Math.abs(b.bitrate - 128_000) ||
          b.bitrate - a.bitrate,
      )[0] ?? null
    );
  }
  if (withBitrate.length > 0 && quality === "high") {
    return [...withBitrate].sort((a, b) => b.bitrate - a.bitrate)[0] ?? null;
  }

  const order =
    preferredCodec === "aac" ? [140, 139, 251, 250, 249] : PREFERRED_ITAGS;
  for (const itag of order) {
    const match = candidates.find((format) => format.itag === itag);
    if (match) return match;
  }
  return [...candidates].sort((a, b) => b.bitrate - a.bitrate)[0] ?? null;
}

function expiryFromUrl(url: string): string | null {
  try {
    const expire = Number(new URL(url).searchParams.get("expire"));
    return Number.isFinite(expire) && expire > 0
      ? new Date(expire * 1000).toISOString()
      : null;
  } catch {
    return null;
  }
}

export function toResolvedStream(format: AudioFormat): ResolvedAudioStream {
  const isOpus =
    format.mimeType.includes("opus") || format.mimeType.includes("webm");
  return {
    url: format.url,
    mimeType: format.mimeType.split(";")[0]?.trim() || "audio/webm",
    codec: isOpus ? "opus" : "aac",
    bitrate: format.bitrate || 160_000,
    itag: format.itag,
    expiresAt: expiryFromUrl(format.url),
    ...(format.contentLength ? { contentLength: format.contentLength } : {}),
  };
}

export function requiresBotCheck(playerResponse: unknown): boolean {
  return (
    asRecord(asRecord(playerResponse)?.playabilityStatus)?.status ===
    "LOGIN_REQUIRED"
  );
}

export function playabilityError(playerResponse: unknown): string | null {
  const status = asRecord(asRecord(playerResponse)?.playabilityStatus);
  if (!status || status.status === "OK") return null;
  return typeof status.reason === "string" && status.reason
    ? status.reason
    : `Playability status ${String(status.status)}`;
}
