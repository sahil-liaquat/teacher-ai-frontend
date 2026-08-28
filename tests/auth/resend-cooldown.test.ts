import assert from "node:assert/strict";
import test from "node:test";

import { COOLDOWN_MS, cooldownRemaining, startCooldown } from "../../lib/resend-cooldown.ts";

function store() {
  const map = new Map<string, string>();
  return {
    read: (k: string) => map.get(k) ?? null,
    write: (k: string, v: string) => void map.set(k, v),
    map
  };
}

test("no cooldown for an address never sent to", () => {
  const s = store();
  assert.equal(cooldownRemaining("a@b.com", 1_000, s.read), 0);
});

test("starting a cooldown blocks the same address for the full window", () => {
  const s = store();
  startCooldown("a@b.com", 1_000, s.write);
  assert.equal(cooldownRemaining("a@b.com", 1_000, s.read), Math.ceil(COOLDOWN_MS / 1000));
});

test("the cooldown expires exactly at the window", () => {
  const s = store();
  startCooldown("a@b.com", 1_000, s.write);
  assert.equal(cooldownRemaining("a@b.com", 1_000 + COOLDOWN_MS, s.read), 0);
});

test("the cooldown is per address, not global", () => {
  const s = store();
  startCooldown("a@b.com", 1_000, s.write);
  assert.equal(cooldownRemaining("other@b.com", 1_000, s.read), 0);
});

test("the address key is case- and whitespace-insensitive so login and signup agree", () => {
  const s = store();
  startCooldown("  A@B.com ", 1_000, s.write);
  assert.ok(cooldownRemaining("a@b.com", 1_000, s.read) > 0);
});

test("a corrupt stored value is treated as no cooldown rather than throwing", () => {
  const s = store();
  s.write("teachpad_resend:a@b.com", "not-a-number");
  assert.equal(cooldownRemaining("a@b.com", 1_000, s.read), 0);
});
