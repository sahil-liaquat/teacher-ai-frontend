export type SubjectThumbnail = {
  key: string;
  label: string;
  src320: string;
  src640: string;
  alt: string;
};

const subjectAliases: Record<string, string> = {
  science: "science",
  math: "mathematics",
  maths: "mathematics",
  mathematics: "mathematics",
  english: "english",
  geography: "geography",
  history: "history",
  politics: "politics",
  "political science": "politics",
  civics: "politics",
  hindi: "hindi",
  "social science": "social-science",
  "social sciences": "social-science",
  sst: "social-science",
};

const subjectLabels: Record<string, string> = {
  science: "Science",
  mathematics: "Mathematics",
  english: "English",
  geography: "Geography",
  history: "History",
  politics: "Politics",
  hindi: "Hindi",
  "social-science": "Social Science",
  "default-education": "Education",
};

export function normalizeSubjectName(subject: string) {
  return subject
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function getSubjectThumbnail(subject: string): SubjectThumbnail {
  const key = subjectAliases[normalizeSubjectName(subject)] || "default-education";
  const label = subjectLabels[key];
  const base = `/assets/workspace/subjects/${key}`;
  return {
    key,
    label,
    src320: `${base}-320.webp`,
    src640: `${base}-640.webp`,
    alt: `${label} subject illustration`,
  };
}
