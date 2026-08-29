// Vitest global setup.
//
// Node 22+ ships an experimental global `localStorage` (node:sqlite-backed)
// that shadows jsdom's Storage implementation and surfaces as a plain object
// with no Storage methods. This breaks any test that touches localStorage
// (consent banner, theme, marketing analytics). Polyfill the missing Storage
// API with a simple in-memory map when it is not functional.
function installLocalStoragePolyfill() {
  const existing = globalThis.localStorage as Storage | undefined;
  if (existing && typeof existing.clear === "function") {
    return; // Real Storage already available — nothing to do.
  }

  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}

installLocalStoragePolyfill();
