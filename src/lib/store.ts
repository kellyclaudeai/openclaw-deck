import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AgentConfig,
  AgentSession,
  AgentStatus,
  ChatMessage,
  DeckConfig,
  GatewayEvent,
  SessionUsage,
} from "../types";
import { GatewayClient } from "./gateway-client";
import { themes, applyTheme } from "../themes";
import {
  mergeChatMessages,
  normalizeGatewayHistoryMessages,
  persistSnapshot,
  readSnapshotFromIndexedDb,
  readSnapshotFromLocalStorage,
  type PersistedDeckSnapshot,
} from "./persistence";

// ─── Default Config ───

const DEFAULT_CONFIG: DeckConfig = {
  gatewayUrl: "ws://127.0.0.1:18789",
  token: undefined,
  agents: [],
};

const PERSIST_DEBOUNCE_MS = 160;

// ─── Store Shape ───

interface DeckStore {
  config: DeckConfig;
  sessions: Record<string, AgentSession>;
  gatewayConnected: boolean;
  columnOrder: string[];
  drafts: Record<string, string>;
  client: GatewayClient | null;
  theme: string;

  // Actions
  initialize: (config: Partial<DeckConfig>) => void;
  addAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  reorderColumns: (order: string[]) => void;
  setDraft: (agentId: string, text: string) => void;
  sendMessage: (agentId: string, text: string) => Promise<void>;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  appendMessageChunk: (agentId: string, runId: string, chunk: string) => void;
  finalizeMessage: (agentId: string, runId: string) => void;
  handleGatewayEvent: (event: GatewayEvent) => void;
  createAgentOnGateway: (agent: AgentConfig) => Promise<void>;
  deleteAgentOnGateway: (agentId: string) => Promise<void>;
  refreshUsageForAgent: (agentId: string) => Promise<void>;
  rehydrateSessionHistory: (agentId: string) => Promise<void>;
  rehydrateAllSessionHistories: () => Promise<void>;
  disconnect: () => void;
  setTheme: (themeId: string) => void;
}

interface HydratedState {
  config: DeckConfig;
  sessions: Record<string, AgentSession>;
  columnOrder: string[];
  drafts: Record<string, string>;
}

// ─── Helpers ───

function createSession(agentId: string): AgentSession {
  return {
    agentId,
    status: "idle",
    messages: [],
    activeRunId: null,
    tokenCount: 0,
    connected: false,
  };
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sessionKeyForAgent(agentId: string): string {
  return `agent:main:${agentId}`;
}

function getAgentIdFromSessionKey(sessionKey: string | undefined): string {
  const parts = sessionKey?.split(":") ?? [];
  return parts[2] ?? parts[1] ?? "main";
}

function hydrateFromSnapshot(
  config: DeckConfig,
  snapshot: PersistedDeckSnapshot | null
): HydratedState {
  const agents = snapshot?.agents?.length ? snapshot.agents : config.agents;
  const agentIds = agents.map((agent) => agent.id);
  const sessions: Record<string, AgentSession> = {};
  const drafts: Record<string, string> = {};

  for (const agent of agents) {
    const base = createSession(agent.id);
    const cached = snapshot?.sessions?.[agent.id];

    sessions[agent.id] = {
      ...base,
      messages: cached
        ? mergeChatMessages([], cached.messages).map((msg) => ({
            ...msg,
            streaming: false,
          }))
        : [],
      tokenCount: cached?.tokenCount ?? 0,
      usage: cached?.usage,
    };

    drafts[agent.id] = snapshot?.drafts?.[agent.id] ?? "";
  }

  const columnOrder = normalizeColumnOrder(snapshot?.columnOrder, agentIds);

  return {
    config: { ...config, agents },
    sessions,
    columnOrder,
    drafts,
  };
}

function normalizeColumnOrder(order: string[] | undefined, agentIds: string[]): string[] {
  const known = new Set(agentIds);
  const inOrder = (order ?? []).filter((id) => known.has(id));
  const seen = new Set(inOrder);

  for (const id of agentIds) {
    if (!seen.has(id)) inOrder.push(id);
  }

  return inOrder;
}

function hasAnyMessages(sessions: Record<string, AgentSession>): boolean {
  return Object.values(sessions).some((session) => session.messages.length > 0);
}

function hasAnyDrafts(drafts: Record<string, string>): boolean {
  return Object.values(drafts).some((draft) => draft.trim().length > 0);
}

function buildPersistedSnapshot(state: DeckStore): PersistedDeckSnapshot {
  const sessions: PersistedDeckSnapshot["sessions"] = {};

  for (const [agentId, session] of Object.entries(state.sessions)) {
    sessions[agentId] = {
      messages: mergeChatMessages([], session.messages),
      tokenCount: session.tokenCount,
      usage: session.usage,
    };
  }

  return {
    version: 1,
    updatedAt: Date.now(),
    agents: state.config.agents,
    columnOrder: state.columnOrder,
    drafts: state.drafts,
    sessions,
  };
}

// ─── Store ───

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
  config: DEFAULT_CONFIG,
  sessions: {},
  gatewayConnected: false,
  columnOrder: [],
  drafts: {},
  client: null,
  theme: 'midnight',

  initialize: (partialConfig) => {
    const config = { ...DEFAULT_CONFIG, ...partialConfig };
    const localSnapshot = readSnapshotFromLocalStorage();
    const hydrated = hydrateFromSnapshot(config, localSnapshot);

    // Create the gateway client
    const client = new GatewayClient({
      url: hydrated.config.gatewayUrl,
      token: hydrated.config.token,
      onEvent: (event) => get().handleGatewayEvent(event),
      onConnection: (connected) => {
        set((state) => {
          const sessions: Record<string, AgentSession> = {};
          for (const [id, session] of Object.entries(state.sessions)) {
            sessions[id] = {
              ...session,
              connected,
              status: connected
                ? session.status === "disconnected"
                  ? "idle"
                  : session.status
                : "disconnected",
            };
          }

          return { gatewayConnected: connected, sessions };
        });

        if (connected) {
          for (const id of Object.keys(get().sessions)) {
            void get().refreshUsageForAgent(id);
          }
          void get().rehydrateAllSessionHistories();
        }
      },
    });

    set({
      config: hydrated.config,
      sessions: hydrated.sessions,
      columnOrder: hydrated.columnOrder,
      drafts: hydrated.drafts,
      client,
    });

    client.connect();

    if (!localSnapshot) {
      void readSnapshotFromIndexedDb().then((indexedDbSnapshot) => {
        if (!indexedDbSnapshot) return;

        set((state) => {
          if (hasAnyMessages(state.sessions) || hasAnyDrafts(state.drafts)) {
            return state;
          }

          const fromIndexedDb = hydrateFromSnapshot(
            {
              ...state.config,
              agents: state.config.agents,
            },
            indexedDbSnapshot
          );

          return {
            config: { ...state.config, agents: fromIndexedDb.config.agents },
            sessions: fromIndexedDb.sessions,
            columnOrder: fromIndexedDb.columnOrder,
            drafts: fromIndexedDb.drafts,
          };
        });
      });
    }
  },

  addAgent: (agent) => {
    set((state) => ({
      config: {
        ...state.config,
        agents: [...state.config.agents, agent],
      },
      sessions: {
        ...state.sessions,
        [agent.id]: createSession(agent.id),
      },
      columnOrder: [...state.columnOrder, agent.id],
      drafts: {
        ...state.drafts,
        [agent.id]: "",
      },
    }));
  },

  removeAgent: (agentId) => {
    set((state) => {
      const { [agentId]: _removedSession, ...sessions } = state.sessions;
      const { [agentId]: _removedDraft, ...drafts } = state.drafts;

      return {
        config: {
          ...state.config,
          agents: state.config.agents.filter((a) => a.id !== agentId),
        },
        sessions,
        columnOrder: state.columnOrder.filter((id) => id !== agentId),
        drafts,
      };
    });
  },

  reorderColumns: (order) => {
    set((state) => ({
      columnOrder: normalizeColumnOrder(order, state.config.agents.map((agent) => agent.id)),
    }));
  },

  setDraft: (agentId, text) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [agentId]: text,
      },
    }));
  },

  sendMessage: async (agentId, text) => {
    const { client, sessions } = get();
    if (!client?.connected) {
      console.error("Gateway not connected");
      return;
    }

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const session = sessions[agentId];
    if (!session) return;

    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: {
          ...session,
          messages: [...session.messages, userMsg],
          status: "thinking",
        },
      },
    }));

    try {
      // All columns route through the default "main" agent on the gateway,
      // using distinct session keys to keep conversations separate.
      const sessionKey = sessionKeyForAgent(agentId);
      const { runId } = await client.runAgent("main", text, sessionKey);

      // Create placeholder assistant message for streaming
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        streaming: true,
        runId,
      };

      set((state) => ({
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...state.sessions[agentId],
            messages: [...state.sessions[agentId].messages, assistantMsg],
            activeRunId: runId,
            status: "streaming",
          },
        },
      }));
    } catch (err) {
      console.error(`Failed to run agent ${agentId}:`, err);
      set((state) => ({
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...state.sessions[agentId],
            status: "error",
          },
        },
      }));
    }
  },

  setAgentStatus: (agentId, status) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [agentId]: {
          ...state.sessions[agentId],
          status,
        },
      },
    }));
  },

  appendMessageChunk: (agentId, runId, chunk) => {
    set((state) => {
      const session = state.sessions[agentId];
      if (!session) return state;

      let didAppend = false;
      const messages = session.messages.map((msg) => {
        if (msg.runId === runId && msg.streaming) {
          didAppend = true;
          return { ...msg, text: msg.text + chunk };
        }
        return msg;
      });

      if (!didAppend) {
        messages.push({
          id: makeId(),
          role: "assistant",
          text: chunk,
          timestamp: Date.now(),
          streaming: true,
          runId,
        });
      }

      return {
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...session,
            messages,
            activeRunId: runId,
            tokenCount: session.tokenCount + chunk.length, // approximate
          },
        },
      };
    });
  },

  finalizeMessage: (agentId, runId) => {
    set((state) => {
      const session = state.sessions[agentId];
      if (!session) return state;

      const messages = session.messages.map((msg) => {
        if (msg.runId === runId) {
          return { ...msg, streaming: false };
        }
        return msg;
      });

      return {
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...session,
            messages,
            activeRunId: null,
            status: "idle",
          },
        },
      };
    });
  },

  handleGatewayEvent: (event) => {
    const payload = event.payload as Record<string, unknown>;

    switch (event.event) {
      // Agent streaming events
      // Format: { runId, stream: "assistant"|"lifecycle"|"tool_use", data: {...}, sessionKey: "agent:<id>:<key>" }
      case "agent": {
        const runId = payload.runId as string;
        const stream = payload.stream as string | undefined;
        const data = payload.data as Record<string, unknown> | undefined;
        const agentId = getAgentIdFromSessionKey(payload.sessionKey as string | undefined);

        if (stream === "assistant" && data?.delta) {
          get().appendMessageChunk(agentId, runId, data.delta as string);
          get().setAgentStatus(agentId, "streaming");
        } else if (stream === "lifecycle") {
          const phase = data?.phase as string | undefined;
          if (phase === "start") {
            get().setAgentStatus(agentId, "thinking");
          } else if (phase === "end") {
            get().finalizeMessage(agentId, runId);
            void get().refreshUsageForAgent(agentId);
          }
        } else if (stream === "tool_use" || stream === "tool") {
          get().setAgentStatus(agentId, "tool_use");
        }
        break;
      }

      // Presence changes (agents coming online/offline)
      case "presence": {
        const agents = payload.agents as
          | Record<string, { online: boolean }>
          | undefined;
        if (agents) {
          set((state) => {
            const sessions = { ...state.sessions };
            for (const [id, info] of Object.entries(agents)) {
              if (sessions[id]) {
                sessions[id] = {
                  ...sessions[id],
                  connected: info.online,
                  status: info.online ? sessions[id].status : "disconnected",
                };
              }
            }
            return { sessions };
          });
        }
        break;
      }

      // Tick events (keep-alive, can update token counts, etc.)
      case "tick": {
        // Could update token usage, cost, etc.
        break;
      }

      // Context compaction dividers
      case "compaction": {
        const agentId = getAgentIdFromSessionKey(payload.sessionKey as string | undefined);
        const beforeTokens = (payload.beforeTokens as number) ?? 0;
        const afterTokens = (payload.afterTokens as number) ?? 0;
        const droppedMessages = (payload.droppedMessages as number) ?? 0;

        const compactionMsg: ChatMessage = {
          id: makeId(),
          role: "compaction",
          text: "",
          timestamp: Date.now(),
          compaction: { beforeTokens, afterTokens, droppedMessages },
        };

        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                messages: [...session.messages, compactionMsg],
              },
            },
          };
        });
        break;
      }

      // Real usage data from gateway
      case "sessions.usage": {
        const agentId = getAgentIdFromSessionKey(payload.sessionKey as string | undefined);
        const usage = payload.usage as SessionUsage | undefined;

        if (usage) {
          set((state) => {
            const session = state.sessions[agentId];
            if (!session) return state;
            return {
              sessions: {
                ...state.sessions,
                [agentId]: {
                  ...session,
                  usage,
                  tokenCount: usage.totalTokens,
                },
              },
            };
          });
        }
        break;
      }

      default:
        console.log("[DeckStore] Unhandled event:", event.event, payload);
    }
  },

  createAgentOnGateway: async (agent) => {
    const { client } = get();
    try {
      if (client?.connected) {
        await client.createAgent({
          id: agent.id,
          name: agent.name,
          model: agent.model,
          context: agent.context,
          shell: agent.shell,
        });
      }
    } catch (err) {
      console.warn("[DeckStore] Gateway createAgent failed, adding locally:", err);
    }
    get().addAgent(agent);
  },

  deleteAgentOnGateway: async (agentId) => {
    const { client } = get();
    try {
      if (client?.connected) {
        await client.deleteAgent(agentId);
      }
    } catch (err) {
      console.warn("[DeckStore] Gateway deleteAgent failed, removing locally:", err);
    }
    get().removeAgent(agentId);
  },

  refreshUsageForAgent: async (agentId) => {
    const { client } = get();
    if (!client?.connected) return;

    try {
      const result = (await client.listSessions()) as {
        sessions?: Array<{
          key?: string;
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
          model?: string;
          failover?: { from: string; to: string; reason: string };
        }>;
      };

      const sessionKey = sessionKeyForAgent(agentId);
      const match = result.sessions?.find((s) => s.key === sessionKey);
      if (!match) return;

      const usage: SessionUsage = {
        inputTokens: match.inputTokens ?? 0,
        outputTokens: match.outputTokens ?? 0,
        totalTokens: match.totalTokens ?? 0,
        model: match.model,
        failover: match.failover,
      };

      set((state) => {
        const session = state.sessions[agentId];
        if (!session) return state;
        return {
          sessions: {
            ...state.sessions,
            [agentId]: {
              ...session,
              usage,
              tokenCount: usage.totalTokens,
            },
          },
        };
      });
    } catch (err) {
      console.warn("[DeckStore] Failed to refresh usage from sessions.list:", err);
    }
  },

  rehydrateSessionHistory: async (agentId) => {
    const { client } = get();
    if (!client?.connected) return;

    try {
      const historyPayload = await client.getSessionHistory(sessionKeyForAgent(agentId));
      if (!historyPayload) return;

      const canonical = normalizeGatewayHistoryMessages(historyPayload);
      if (canonical.length === 0) return;

      set((state) => {
        const session = state.sessions[agentId];
        if (!session) return state;

        return {
          sessions: {
            ...state.sessions,
            [agentId]: {
              ...session,
              messages: mergeChatMessages(session.messages, canonical),
            },
          },
        };
      });
    } catch (err) {
      console.warn(`[DeckStore] Failed to rehydrate history for ${agentId}:`, err);
    }
  },

  rehydrateAllSessionHistories: async () => {
    const agentIds = [...get().columnOrder];
    await Promise.all(agentIds.map((agentId) => get().rehydrateSessionHistory(agentId)));
  },

  disconnect: () => {
    get().client?.disconnect();
    set({ gatewayConnected: false, client: null });
  },

  setTheme: (themeId: string) => {
    set({ theme: themeId });
    const theme = themes[themeId];
    if (theme) {
      applyTheme(theme);
    }
  },
}),
    {
      name: 'openclaw-deck-storage',
      partialize: (state) => ({
        config: state.config,
        sessions: state.sessions,
        columnOrder: state.columnOrder,
        drafts: state.drafts,
        theme: state.theme,
        // Exclude: client, gatewayConnected (runtime state)
      }),
    }
  )
);

let persistTimer: ReturnType<typeof setTimeout> | null = null;

useDeckStore.subscribe((state) => {
  if (state.config.agents.length === 0) return;

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    const snapshot = buildPersistedSnapshot(useDeckStore.getState());
    void persistSnapshot(snapshot);
  }, PERSIST_DEBOUNCE_MS);
});
