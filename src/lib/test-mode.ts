// Test Mode — client-side flag that tags any activity/workspace edits made
// during a testing session so they can be wiped later without touching real data.
import { useSyncExternalStore } from "react";

const LS_KEY = "st.testMode.v1";

export interface TestModeState {
  enabled: boolean;
  sessionId: string | null;
  startedAt: string | null; // ISO
}

const DEFAULT: TestModeState = { enabled: false, sessionId: null, startedAt: null };

function read(): TestModeState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as TestModeState) } : DEFAULT;
  } catch { return DEFAULT; }
}

let cache: TestModeState = read();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
  }
  listeners.forEach((l) => l());
}

export function getTestMode(): TestModeState { return cache; }

export function enableTestMode(): TestModeState {
  const now = new Date();
  const id = `TEST-${now.toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
  cache = { enabled: true, sessionId: id, startedAt: now.toISOString() };
  emit();
  return cache;
}

export function disableTestMode(): TestModeState {
  cache = { ...DEFAULT };
  emit();
  return cache;
}

function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
function snapshot() { return cache; }
function serverSnapshot() { return DEFAULT; }

export function useTestMode(): TestModeState {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
