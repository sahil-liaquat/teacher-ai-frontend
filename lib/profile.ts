"use client";

export type TeacherProfile = {
  name: string;
  school: string;
  subjects: string;
};

const PROFILE_KEY = "teacher_ai_profile";
const PROFILE_KEY_PREFIX = "teacher_ai_profile:";
export const TEACHER_PROFILE_UPDATED_EVENT = "teacher-profile-updated";

function getProfileKey(userId?: string) {
  return userId ? `${PROFILE_KEY_PREFIX}${userId}` : PROFILE_KEY;
}

export function getTeacherProfile(userId?: string): TeacherProfile {
  if (typeof window === "undefined") return defaultTeacherProfile();
  if (!userId) return defaultTeacherProfile();
  const raw = window.localStorage.getItem(getProfileKey(userId));
  if (!raw) return defaultTeacherProfile();
  try {
    return { ...defaultTeacherProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultTeacherProfile();
  }
}

export function saveTeacherProfile(profile: TeacherProfile, userId: string) {
  window.localStorage.setItem(getProfileKey(userId), JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(TEACHER_PROFILE_UPDATED_EVENT, { detail: { profile, userId } }));
}

export function clearTeacherProfile(userId?: string) {
  if (typeof window === "undefined") return;
  if (userId) {
    window.localStorage.removeItem(getProfileKey(userId));
    return;
  }
  window.localStorage.removeItem(PROFILE_KEY);
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(PROFILE_KEY_PREFIX)) window.localStorage.removeItem(key);
  }
}

export function getTeacherFirstName(profile?: TeacherProfile) {
  const name = (profile?.name || "").trim();
  return name.split(/\s+/)[0] || "Teacher";
}

export function defaultTeacherProfile(): TeacherProfile {
  return {
    name: "Teacher",
    school: "",
    subjects: ""
  };
}
