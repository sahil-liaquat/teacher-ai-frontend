export type Violation = { file: string; rule: string; value: string; line: number };

const RULES: { rule: string; pattern: RegExp }[] = [
  { rule: "arbitrary-font-size", pattern: /\btext-\[[0-9.]+(?:px|rem|em)\]/g },
  { rule: "arbitrary-radius", pattern: /\brounded(?:-[a-z]+)?-\[[^\]]+\]/g },
  { rule: "arbitrary-shadow", pattern: /\bshadow-\[[^\]]+\]/g },
  { rule: "raw-hex", pattern: /#[0-9a-fA-F]{3,8}\b/g }
];

const SUB_12 = /\btext-\[([0-9]|1[01])(?:\.[0-9]+)?px\]/g;

/** Every token violation in one file's source, with 1-indexed line numbers. */
export function findViolations(source: string, file: string): Violation[] {
  const out: Violation[] = [];
  const lines = source.split("\n");

  lines.forEach((text, index) => {
    for (const { rule, pattern } of RULES) {
      for (const match of Array.from(text.matchAll(new RegExp(pattern.source, "g")))) {
        out.push({ file, rule, value: match[0], line: index + 1 });
      }
    }
    for (const match of Array.from(text.matchAll(new RegExp(SUB_12.source, "g")))) {
      out.push({ file, rule: "sub-12px-font", value: match[0], line: index + 1 });
    }
  });

  return out;
}
