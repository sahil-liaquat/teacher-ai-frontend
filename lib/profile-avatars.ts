export const PROFILE_AVATARS = [
  { key: "giraffe", label: "Giraffe", src: "/assets/avatars/animal-giraffe.png" },
  { key: "panda", label: "Panda", src: "/assets/avatars/animal-panda.png" },
  { key: "fox", label: "Fox", src: "/assets/avatars/animal-fox.png" },
  { key: "bunny", label: "Bunny", src: "/assets/avatars/animal-bunny.png" },
  { key: "bear", label: "Bear", src: "/assets/avatars/animal-bear.png" },
  { key: "owl", label: "Owl", src: "/assets/avatars/animal-owl.png" },
] as const;

export type ProfileAvatarKey = (typeof PROFILE_AVATARS)[number]["key"];

export function isProfileAvatarKey(value: string | null | undefined): value is ProfileAvatarKey {
  return PROFILE_AVATARS.some((avatar) => avatar.key === value);
}

export function normalizeProfileAvatarKey(value: string | null | undefined): ProfileAvatarKey {
  return isProfileAvatarKey(value) ? value : "giraffe";
}

export function getProfileAvatar(value: string | null | undefined) {
  const key = normalizeProfileAvatarKey(value);
  return PROFILE_AVATARS.find((avatar) => avatar.key === key) ?? PROFILE_AVATARS[0];
}
