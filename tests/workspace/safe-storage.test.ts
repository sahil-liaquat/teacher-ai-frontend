import assert from "node:assert/strict";
import test from "node:test";

import { readStoredItem, removeStoredItem, writeStoredItem } from "../../lib/safe-storage.ts";

type StorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function withStorage<T>(storage: StorageStub | (() => never) | null, body: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  if (storage === null) {
    delete (globalThis as { window?: unknown }).window;
  } else if (typeof storage === "function") {
    // Some browsers (cookies disabled, sandboxed iframes) throw on the
    // `localStorage` *getter*, before any method is called.
    Object.defineProperty(globalThis, "window", {
      value: Object.defineProperty({}, "localStorage", { get: storage }),
      configurable: true,
      writable: true,
    });
  } else {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
      writable: true,
    });
  }
  try {
    return body();
  } finally {
    delete (globalThis as { window?: unknown }).window;
    if (original) Object.defineProperty(globalThis, "window", original);
  }
}

function memoryStorage(): StorageStub & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

test("round-trips a value through a working storage", () => {
  withStorage(memoryStorage(), () => {
    assert.equal(writeStoredItem("k", "v"), true);
    assert.equal(readStoredItem("k"), "v");
    removeStoredItem("k");
    assert.equal(readStoredItem("k"), null);
  });
});

test("a full or read-only storage reports failure instead of throwing", () => {
  // iOS private browsing and a full quota both throw on setItem. The Primary
  // context provider wrote straight through, so this threw out of a mount
  // effect and took the whole workspace to the error boundary.
  const storage = memoryStorage();
  storage.setItem = () => {
    throw new DOMException("QuotaExceededError");
  };
  withStorage(storage, () => {
    assert.equal(writeStoredItem("k", "v"), false);
  });
});

test("a throwing localStorage getter reads as absent, not as a crash", () => {
  withStorage(
    () => {
      throw new Error("SecurityError: storage is disabled");
    },
    () => {
      assert.equal(readStoredItem("k"), null);
      assert.equal(writeStoredItem("k", "v"), false);
      assert.doesNotThrow(() => removeStoredItem("k"));
    }
  );
});

test("server-side rendering has no window and must not throw", () => {
  withStorage(null, () => {
    assert.equal(readStoredItem("k"), null);
    assert.equal(writeStoredItem("k", "v"), false);
    assert.doesNotThrow(() => removeStoredItem("k"));
  });
});
