import { useRef, useState, type ChangeEvent } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import {
  clearLocalProfilePicture,
  setLocalProfilePicture,
  useLocalProfilePicture,
} from "@/shared/utils/localImageOverrides";
import { imageFileToDataUrl } from "@/shared/utils/imageFile";

export function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const accountId = user?.id ?? null;
  const localAvatarUrl = useLocalProfilePicture(accountId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const image = await imageFileToDataUrl(file, 512);
      setLocalProfilePicture(accountId, image);
      setMessage("Your picture has been saved on this device.");
    } catch {
      setError("Couldn't save that picture. Choose a supported image under 15 MB.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    clearLocalProfilePicture(accountId);
    setError(null);
    setMessage("Your custom picture has been removed.");
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="overflow-hidden rounded-[16px] border border-border-alpha-8 bg-bg-elevated">
        <div className="flex items-center gap-[16px] border-b border-border-alpha-8 p-[18px]">
          <UserAvatar user={user} size={68} className="!rounded-full" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-[650] text-text-primary">
              {user?.displayName || user?.username || "Your LYNE account"}
            </div>
            <div className="mt-[4px] text-[12px] text-text-tertiary">
              {user?.username ? `@${user.username}` : user?.email || "Profile picture"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[12px] p-[18px]">
          <div className="flex flex-col gap-[5px]">
            <h3 className="m-0 text-[14px] font-[650] text-text-primary">Account picture</h3>
            <p className="m-0 text-[12px] leading-[18px] text-text-tertiary">
              Choose an image from your device. LYNE saves it locally and uses it anywhere your account avatar appears. It does not sync to other devices and may be lost if app data is removed or LYNE is reinstalled.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
          />

          {error && <p role="alert" className="m-0 text-[12px] text-red-400">{error}</p>}
          {message && <p role="status" className="m-0 text-[12px] text-emerald-400">{message}</p>}

          <div className="flex flex-wrap items-center gap-[9px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="inline-flex h-[38px] items-center justify-center rounded-[10px] bg-[#a78bfa] px-[15px] text-[12px] font-[700] text-[#171326] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : localAvatarUrl ? "Change picture" : "Choose picture"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving || !localAvatarUrl}
              className="inline-flex h-[38px] items-center justify-center rounded-[10px] border border-border-alpha-12 bg-transparent px-[14px] text-[12px] font-[600] text-text-secondary transition-colors hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove picture
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
