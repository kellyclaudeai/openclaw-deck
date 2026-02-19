import type { AgentConfig, ChatMessage, SessionUsage } from "../types";

export const PERSISTENCE_KEY = "openclaw.deck.ui.v1";
const INDEXED_DB_NAME = "openclaw.deck";
const INDEXED_DB_STORE = "ui";
const INDEXED_DB_KEY = "snapshot";

export interface PersistedSessionSnapshot {
  messages: ChatMessage[];
  tokenCount: number;
  usage?: SessionUsage;
}

export interface PersistedDeckSnapshot {
  version: 1;
  updatedAt: number;
  agents: AgentConfig[];
  columnOrder: string[];
  drafts: Record<string, string>;
  sessions: Record<string, PersistedSessionSnapshot>;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function readSnapshotFromLocalStorage(
  storage: StorageLike | null = getSafeLocalStorage()
): PersistedDeckSnapshot | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(PERSISTENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDeckSnapshot;
    return isPersistedSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSnapshotToLocalStorage(
  snapshot: PersistedDeckSnapshot,
  storage: StorageLike | null = getSafeLocalStorage()
): boolean {
  if (!storage || !isPersistedSnapshot(snapshot)) return false;

  try {
    storage.setItem(PERSISTENCE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export async function readSnapshotFromIndexedDb(): Promise<PersistedDeckSnapshot | null> {
  if (!canUseIndexedDb()) return null;

  try {
    const db = await openIndexedDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(INDEXED_DB_STORE, "readonly");
      const store = tx.objectStore(INDEXED_DB_STORE);
      const req = store.get(INDEXED_DB_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("Failed to read IndexedDB snapshot"));
    });

    db.close();
    return isPersistedSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}

export async function writeSnapshotToIndexedDb(snapshot: PersistedDeckSnapshot): Promise<boolean> {
  if (!canUseIndexedDb() || !isPersistedSnapshot(snapshot)) return false;

  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(INDEXED_DB_STORE, "readwrite");
      const store = tx.objectStore(INDEXED_DB_STORE);
      const req = store.put(snapshot, INDEXED_DB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error("Failed to write IndexedDB snapshot"));
    });

    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function persistSnapshot(snapshot: PersistedDeckSnapshot): Promise<void> {
  writeSnapshotToLocalStorage(snapshot);
  await writeSnapshotToIndexedDb(snapshot);
}

export function mergeChatMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const merged: ChatMessage[] = [];
  const keyToIndex = new Map<string, number>();

  for (const msg of [...existing, ...incoming]) {
    const keys = messageKeys(msg);
    const existingIndex = findExistingIndex(keys, keyToIndex);

    if (existingIndex === null) {
      const index = merged.push({ ...msg }) - 1;
      for (const key of keys) keyToIndex.set(key, index);
      continue;
    }

    merged[existingIndex] = mergeSingleMessage(merged[existingIndex], msg);
    for (const key of messageKeys(merged[existingIndex])) {
      keyToIndex.set(key, existingIndex);
    }
  }

  return merged.sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return compareMessageOrder(a, b);
  });
}

export function normalizeGatewayHistoryMessages(payload: unknown): ChatMessage[] {
  const items = extractHistoryItems(payload);

  return items
    .map((item, index) => normalizeHistoryItem(item, index))
    .filter((msg): msg is ChatMessage => msg !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function compareMessageOrder(a: ChatMessage, b: ChatMessage): number {
  const left = `${a.role}:${a.id ?? ""}:${a.runId ?? ""}:${a.text.slice(0, 32)}`;
  const right = `${b.role}:${b.id ?? ""}:${b.runId ?? ""}:${b.text.slice(0, 32)}`;
  return left.localeCompare(right);
}

function mergeSingleMessage(base: ChatMessage, next: ChatMessage): ChatMessage {
  const preferNextText = next.text.length >= base.text.length;

  return {
    ...base,
    ...next,
    id: base.id ?? next.id,
    role: base.role ?? next.role,
    text: preferNextText ? next.text : base.text,
    timestamp: Math.min(base.timestamp, next.timestamp),
    streaming: base.streaming && next.streaming ? true : false,
    runId: base.runId ?? next.runId,
    compaction: base.compaction ?? next.compaction,
    toolUse: base.toolUse ?? next.toolUse,
  };
}

function messageKeys(msg: ChatMessage): string[] {
  const keys: string[] = [];
  if (msg.id) keys.push(`id:${msg.id}`);
  if (msg.runId) keys.push(`run:${msg.role}:${msg.runId}`);
  keys.push(`ts:${msg.role}:${msg.timestamp}:${normalizeTextForKey(msg.text)}`);
  return keys;
}

function normalizeTextForKey(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, 120);
}

function findExistingIndex(
  keys: string[],
  keyToIndex: Map<string, number>
): number | null {
  for (const key of keys) {
    const idx = keyToIndex.get(key);
    if (typeof idx === "number") return idx;
  }
  return null;
}

function normalizeHistoryItem(item: unknown, index: number): ChatMessage | null {
  if (!isRecord(item)) return null;

  const role = normalizeRole(item.role ?? item.type);
  if (!role) return null;

  const text = extractText(item.text ?? item.content ?? item.message ?? "");
  const timestamp = extractTimestamp(item.timestamp ?? item.createdAt ?? item.time, index);
  const id = toOptionalString(item.id ?? item.messageId) ?? `hist-${role}-${timestamp}-${index}`;

  const runId =
    toOptionalString(item.runId) ??
    (isRecord(item.run) ? toOptionalString(item.run.id) : undefined);

  const beforeTokens = toOptionalNumber(item.beforeTokens);
  const afterTokens = toOptionalNumber(item.afterTokens);
  const droppedMessages = toOptionalNumber(item.droppedMessages);

  return {
    id,
    role,
    text,
    timestamp,
    streaming: false,
    runId,
    ...(role === "compaction" &&
    beforeTokens !== undefined &&
    afterTokens !== undefined &&
    droppedMessages !== undefined
      ? {
          compaction: {
            beforeTokens,
            afterTokens,
            droppedMessages,
          },
        }
      : {}),
  };
}

function extractHistoryItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates: unknown[] = [
    payload.messages,
    payload.history,
    payload.items,
    isRecord(payload.session) ? payload.session.messages : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        if (!isRecord(part)) return "";
        if (typeof part.text === "string") return part.text;
        if (typeof part.content === "string") return part.content;
        return "";
      })
      .join("");
  }

  if (isRecord(value)) {
    if (typeof value.text === "string") return value.text;
    if (typeof value.content === "string") return value.content;
  }

  return "";
}

function normalizeRole(value: unknown): ChatMessage["role"] | null {
  if (typeof value !== "string") return null;
  if (value === "assistant" || value === "user" || value === "system" || value === "compaction") {
    return value;
  }
  return null;
}

function extractTimestamp(value: unknown, fallbackIndex: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return Date.now() + fallbackIndex;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isPersistedSnapshot(value: unknown): value is PersistedDeckSnapshot {
  if (!isRecord(value)) return false;
  if (value.version !== 1) return false;
  if (!Array.isArray(value.agents)) return false;
  if (!Array.isArray(value.columnOrder)) return false;
  if (!isRecord(value.sessions)) return false;
  if (!isRecord(value.drafts)) return false;
  if (typeof value.updatedAt !== "number") return false;
  return true;
}

function getSafeLocalStorage(): StorageLike | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INDEXED_DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
        db.createObjectStore(INDEXED_DB_STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}
