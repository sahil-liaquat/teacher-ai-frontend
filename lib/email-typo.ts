// Suggests a corrected email when the domain or TLD looks like a common typo.
// UX guard only — `EmailStr`/zod treat `you@gmail.con` as syntactically valid,
// so format validation never catches these. Returns null when nothing looks off.
//
// Expected behaviour (verify manually):
//   you@gmial.com   -> you@gmail.com
//   you@gmail.con   -> you@gmail.com
//   you@yhaoo.com   -> you@yahoo.com
//   you@hotmial.com -> you@hotmail.com
//   you@outlok.com  -> you@outlook.com
//   you@school.edu  -> null   (no change)
//   you@gmail.com   -> null   (already correct)

const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "yhaoo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
};

// Applied only when the domain isn't matched above. Order matters: longer keys first.
const TLD_TYPOS: Array<[string, string]> = [
  [".comm", ".com"],
  [".cmo", ".com"],
  [".con", ".com"],
  [".co", ".com"],
  [".ne", ".net"],
];

export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const fixedDomain = DOMAIN_TYPOS[domain];
  if (fixedDomain) return `${local}@${fixedDomain}`;

  for (const [bad, good] of TLD_TYPOS) {
    if (domain.endsWith(bad)) {
      const corrected = `${local}@${domain.slice(0, domain.length - bad.length)}${good}`;
      return corrected === trimmed ? null : corrected;
    }
  }
  return null;
}
