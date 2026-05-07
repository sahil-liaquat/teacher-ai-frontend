"use client";

export type TeacherProfile = {
  name: string;
  school: string;
  subjects: string;
};

const PROFILE_KEY = "teacher_ai_profile";

export function getTeacherProfile(): TeacherProfile {
  if (typeof window === "undefined") return defaultTeacherProfile();
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return defaultTeacherProfile();
  try {
    return { ...defaultTeacherProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultTeacherProfile();
  }
}

export function saveTeacherProfile(profile: TeacherProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("teacher-profile-updated", { detail: profile }));
}

export function getTeacherFirstName(profile?: TeacherProfile) {
  const name = (profile?.name || getTeacherProfile().name || "").trim();
  return name.split(/\s+/)[0] || "Teacher";
}

export function defaultTeacherProfile(): TeacherProfile {
  return {
    name: "Demo Teacher",
    school: "",
    subjects: ""
  };
}
