import { useEffect, useState, useMemo } from "react";
import { FaUser } from "react-icons/fa";
import { useLocalProfilePicture } from "@/shared/utils/localImageOverrides";

export interface UserAvatarProps {
  user?: {
    id?: string | null;
    avatarUrl?: string | null;
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
  } | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function UserAvatar({
  user,
  size = 36,
  className = "",
  style,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const localAvatarUrl = useLocalProfilePicture(user?.id ?? null);
  const imageUrl = localAvatarUrl || user?.avatarUrl || null;

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const initial = useMemo(() => {
    if (!user) return "";
    const name =
      user.displayName?.trim() ||
      user.username?.trim() ||
      user.email?.trim() ||
      "";
    return name ? name[0].toUpperCase() : "";
  }, [user]);

  const hasImage = Boolean(imageUrl && !imgError);

  return (
    <div
      className={`rounded-[12px] bg-border-alpha-14 flex items-center justify-center text-text-secondary border border-border-primary/50 flex-shrink-0 overflow-hidden select-none ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {hasImage ? (
        <img
          src={imageUrl!}
          alt={user?.displayName || user?.username || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : initial ? (
        <span
          className="text-text-primary font-medium select-none"
          style={{ fontSize: Math.max(12, Math.floor(size * 0.42)) }}
        >
          {initial}
        </span>
      ) : (
        <FaUser size={Math.floor(size * 0.45)} />
      )}
    </div>
  );
}

export default UserAvatar;
