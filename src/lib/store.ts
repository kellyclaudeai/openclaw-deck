import { create } from "zustand";
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

// ─── Default Config ───

const DEFAULT_CONFIG: DeckConfig = {
  gatewayUrl: "ws://127.0.0.1:18789",
  token: undefined,
  agents: [],
};

// ─── Store Shape ───

interface DeckStore {
  config: DeckConfig;
  sessions: Record<string, AgentSession>;
  gatewayConnected: boolean;
  columnOrder: string[];
  client: GatewayClient | null;
  theme: string;

  // Actions
  initialize: (config: Partial<DeckConfig>) => void;
  addAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  reorderColumns: (order: string[]) => void;
  sendMessage: (agentId: string, text: string) => Promise<void>;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  appendMessageChunk: (agentId: string, runId: string, chunk: string) => void;
  finalizeMessage: (agentId: string, runId: string) => void;
  handleGatewayEvent: (event: GatewayEvent) => void;
  createAgentOnGateway: (agent: AgentConfig) => Promise<void>;
  deleteAgentOnGateway: (agentId: string) => Promise<void>;
  disconnect: () => void;
  setTheme: (themeId: string) => void;
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

// ─── Store ───

export const useDeckStore = create<DeckStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  sessions: {},
  gatewayConnected: false,
  columnOrder: [],
  client: null,
  theme: 'midnight',

  initialize: (partialConfig) => {
    const config = { ...DEFAULT_CONFIG, ...partialConfig };
    const sessions: Record<string, AgentSession> = {};
    const columnOrder: string[] = [];

    for (const agent of config.agents) {
      sessions[agent.id] = createSession(agent.id);
      columnOrder.push(agent.id);
    }

    // Create the gateway client
    const client = new GatewayClient({
      url: config.gatewayUrl,
      token: config.token,
      onEvent: (event) => get().handleGatewayEvent(event),
      onConnection: (connected) => {
        set({ gatewayConnected: connected });
        if (connected) {
          // Mark all agent sessions as connected
          const sessions = { ...get().sessions };
          for (const id of Object.keys(sessions)) {
            sessions[id] = { ...sessions[id], connected: true };
          }
          set({ sessions });
        }
      },
    });

    set({ config, sessions, columnOrder, client });
    client.connect();
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
    }));
  },

  removeAgent: (agentId) => {
    set((state) => {
      const { [agentId]: _, ...sessions } = state.sessions;
      return {
        config: {
          ...state.config,
          agents: state.config.agents.filter((a) => a.id !== agentId),
        },
        sessions,
        columnOrder: state.columnOrder.filter((id) => id !== agentId),
      };
    });
  },

  reorderColumns: (order) => set({ columnOrder: order }),

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
      const sessionKey = `agent:main:${agentId}`;
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
      if (!session || !session.messages) return state;

      const messages = (session.messages || []).map((msg) => {
        if (msg.runId === runId && msg.streaming) {
          return { ...msg, text: msg.text + chunk };
        }
        return msg;
      });

      return {
        sessions: {
          ...state.sessions,
          [agentId]: {
            ...session,
            messages,
            tokenCount: session.tokenCount + chunk.length, // approximate
          },
        },
      };
    });
  },

  finalizeMessage: (agentId, runId) => {
    set((state) => {
      const session = state.sessions[agentId];
      if (!session || !session.messages) return state;

      const messages = (session.messages || []).map((msg) => {
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
        const sessionKey = payload.sessionKey as string | undefined;

        // Extract column ID from sessionKey "agent:main:<columnId>"
        const parts = sessionKey?.split(":") ?? [];
        const agentId = parts[2] ?? parts[1] ?? "main";

        if (stream === "assistant" && data?.delta) {
          get().appendMessageChunk(agentId, runId, data.delta as string);
          get().setAgentStatus(agentId, "streaming");
        } else if (stream === "lifecycle") {
          const phase = data?.phase as string | undefined;
          if (phase === "start") {
            get().setAgentStatus(agentId, "thinking");
          } else if (phase === "end") {
            get().finalizeMessage(agentId, runId);
          }
        } else if (stream === "tool_use") {
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
        const sessionKey = payload.sessionKey as string | undefined;
        const parts = sessionKey?.split(":") ?? [];
        const agentId = parts[2] ?? parts[1] ?? "main";
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
        const sessionKey = payload.sessionKey as string | undefined;
        const parts = sessionKey?.split(":") ?? [];
        const agentId = parts[2] ?? parts[1] ?? "main";
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
}));
