import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { UserAvatar } from "@/shared/ui/UserAvatar";

export function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user?.avatarUrl]);

  const saveAvatar = async () => {
    const value = avatarUrl.trim();
    if (value) {
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
          throw new Error("Use a public HTTPS image link.");
        }
      } catch {
        setError("Enter a valid public HTTPS image link.");
        setMessage(null);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ avatarUrl: value || null });
      setMessage(value ? "Your account picture has been updated." : "Your account picture has been removed.");
    } catch {
      setError("LYNE couldn't save your account picture. Please try again.");
    } finally {
      setSaving(false);
    }
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
              Add a public HTTPS image link. LYNE saves the link to your account, so your picture follows you when you sign in on another device.
            </p>
          </div>

          <label htmlFor="lyne-profile-avatar-url" className="text-[12px] font-[600] text-text-secondary">
            Image URL
          </label>
          <input
            id="lyne-profile-avatar-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={avatarUrl}
            onChange={(event) => {
              setAvatarUrl(event.target.value);
              setError(null);
              setMessage(null);
            }}
            placeholder="https://example.com/your-picture.png"
            disabled={!user || saving}
            className="h-[42px] w-full rounded-[10px] border border-border-alpha-12 bg-bg-surface px-[12px] text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-[#a78bfa]/70 disabled:opacity-50"
          />

          {!user && (
            <p className="m-0 text-[12px] text-text-tertiary">
              Sign in to a LYNE account to customize its picture.
            </p>
          )}
          {error && <p role="alert" className="m-0 text-[12px] text-red-400">{error}</p>}
          {message && <p role="status" className="m-0 text-[12px] text-emerald-400">{message}</p>}

          <div className="flex flex-wrap items-center gap-[9px]">
            <button
              type="button"
              onClick={saveAvatar}
              disabled={!user || saving || avatarUrl.trim() === (user?.avatarUrl ?? "")}
              className="inline-flex h-[38px] items-center justify-center rounded-[10px] bg-[#a78bfa] px-[15px] text-[12px] font-[700] text-[#171326] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save picture"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAvatarUrl("");
                setError(null);
                setMessage(null);
              }}
              disabled={!user || saving || (!user?.avatarUrl && !avatarUrl.trim())}
              className="inline-flex h-[38px] items-center justify-center rounded-[10px] border border-border-alpha-12 bg-transparent px-[14px] text-[12px] font-[600] text-text-secondary transition-colors hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      <p className="m-0 px-[2px] text-[11px] leading-[17px] text-text-tertiary">
        Use a direct image link that can be viewed publicly. LYNE does not upload or host image files in this setting.
      </p>
    </div>
  );
}
