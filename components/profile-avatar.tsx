"use client";

import { getProfileAvatar, type ProfileAvatarKey } from "@/lib/profile-avatars";

type ProfileAvatarProps = {
  avatarKey?: ProfileAvatarKey | string | null;
  alt?: string;
};

export function BoyAvatar({ avatarKey, alt = "" }: ProfileAvatarProps) {
  const avatar = getProfileAvatar(avatarKey);

  return (
    <img
      src={avatar.src}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      className="h-full w-full object-cover"
    />
  );
}
