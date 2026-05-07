"use client";

export function BoyAvatar() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#eef5ff" />
      <circle cx="32" cy="30" r="18" fill="#ffd8ad" />
      <path d="M17 29c1-12 8-19 18-18 9 1 15 8 14 18-5-5-11-7-19-7-5 0-9 2-13 7Z" fill="#2a2142" />
      <path d="M18 30c2-6 7-10 14-10 8 0 13 4 15 10-4-4-9-6-15-6s-10 2-14 6Z" fill="#382b57" />
      <circle cx="25" cy="34" r="2" fill="#17142d" />
      <circle cx="39" cy="34" r="2" fill="#17142d" />
      <path d="M28 43c3 2 6 2 9 0" fill="none" stroke="#8a4755" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 58c3-10 11-16 19-16s16 6 19 16" fill="#4f7ee8" />
      <path d="M24 49c4 3 12 3 16 0" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}
