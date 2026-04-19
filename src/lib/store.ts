import { create } from "zustand";
import type {
  AgentConfig,
  AgentSession,
  AgentStatus,
  ChatMessage,
  DeckConfig,
  ServerFrame,
} from "../types";
import { MultiClawClient } from "./multiclaw-client";
import { themes, applyTheme } from "../themes";

// ─── Default Config ───

const DEFAULT_CONFIG: DeckConfig = {
  serverUrl: "ws://127.0.0.1:3001/ws",
  agents: [],
};

// ─── Store Shape ───

interface DeckStore {
  config: DeckConfig;
  sessions: Record<string, AgentSession>;
  serverConnected: boolean;
  columnOrder: string[];
  client: MultiClawClient | null;
  theme: string;

  // Actions
  initialize: (config: Partial<DeckConfig>) => void;
  addAgent: (agent: AgentConfig) => void;
  removeAgent: (agentId: string) => void;
  reorderColumns: (order: string[]) => void;
  sendMessage: (agentId: string, text: string) => Promise<void>;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  handleServerFrame: (frame: ServerFrame) => void;
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
  serverConnected: false,
  columnOrder: [],
  client: null,
  theme: "midnight",

  initialize: (partialConfig) => {
    const config = { ...DEFAULT_CONFIG, ...partialConfig };
    const sessions: Record<string, AgentSession> = {};
    const columnOrder: string[] = [];

    for (const agent of config.agents) {
      sessions[agent.id] = createSession(agent.id);
      columnOrder.push(agent.id);
    }

    const client = new MultiClawClient({
      url: config.serverUrl,
      onFrame: (frame) => get().handleServerFrame(frame),
      onConnection: (connected) => {
        set({ serverConnected: connected });
        if (connected) {
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
      console.error("Server not connected");
      return;
    }

    const session = sessions[agentId];
    if (!session) return;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

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

    // Send to backend — the server will stream events back
    client.sendMessage(agentId, text);
  },

  setAgentStatus: (agentId, status) => {
    set((state) => {
      const session = state.sessions[agentId];
      if (!session) return state;
      return {
        sessions: {
          ...state.sessions,
          [agentId]: { ...session, status },
        },
      };
    });
  },

  handleServerFrame: (frame) => {
    switch (frame.type) {
      case "connected":
        // Initial connection ack
        break;

      case "status": {
        const { agentId, runId, status } = frame;

        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;

          // When agent starts thinking, create a placeholder assistant message
          if (
            status === "thinking" &&
            !session.messages.some(
              (m) => m.runId === runId && m.role === "assistant"
            )
          ) {
            const assistantMsg: ChatMessage = {
              id: makeId(),
              role: "assistant",
              text: "",
              timestamp: Date.now(),
              streaming: true,
              runId,
            };
            return {
              sessions: {
                ...state.sessions,
                [agentId]: {
                  ...session,
                  messages: [...session.messages, assistantMsg],
                  activeRunId: runId,
                  status,
                },
              },
            };
          }

          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                status,
                activeRunId: status === "idle" ? null : session.activeRunId,
              },
            },
          };
        });
        break;
      }

      case "result": {
        const { agentId, runId, text } = frame;

        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;

          // Update or create the assistant message with the result
          const existingIdx = session.messages.findIndex(
            (m) => m.runId === runId && m.role === "assistant"
          );

          let messages: ChatMessage[];
          if (existingIdx >= 0) {
            messages = session.messages.map((msg) =>
              msg.runId === runId && msg.role === "assistant"
                ? { ...msg, text: text || msg.text, streaming: false }
                : msg
            );
          } else {
            messages = [
              ...session.messages,
              {
                id: makeId(),
                role: "assistant" as const,
                text: text || "",
                timestamp: Date.now(),
                streaming: false,
                runId,
              },
            ];
          }

          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                messages,
                activeRunId: null,
                status: "idle",
                tokenCount: session.tokenCount + (text?.length ?? 0),
              },
            },
          };
        });
        break;
      }

      case "chunk": {
        const { agentId, runId, text } = frame;
        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;

          const messages = session.messages.map((msg) => {
            if (msg.runId === runId && msg.role === "assistant" && msg.streaming) {
              return { ...msg, text };
            }
            return msg;
          });

          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                messages,
                tokenCount: session.tokenCount + text.length,
              },
            },
          };
        });
        break;
      }

      case "tool_use": {
        const { agentId, runId, toolName } = frame;
        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;

          const toolMsg: ChatMessage = {
            id: makeId(),
            role: "system",
            text: "",
            timestamp: Date.now(),
            toolUse: { name: toolName, status: "running" },
          };

          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                messages: [...session.messages, toolMsg],
                status: "tool_use",
              },
            },
          };
        });
        break;
      }

      case "event": {
        // Forward other SDK events (task_progress, etc.)
        break;
      }

      case "session_init": {
        const { agentId, sessionId } = frame;
        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [agentId]: { ...session, sessionId },
            },
          };
        });
        break;
      }

      case "error": {
        const { agentId, message } = frame;
        console.error(`[MultiClaw] Agent ${agentId} error:`, message);

        set((state) => {
          const session = state.sessions[agentId];
          if (!session) return state;

          // Add error as a system message
          const errorMsg: ChatMessage = {
            id: makeId(),
            role: "system",
            text: `Error: ${message}`,
            timestamp: Date.now(),
          };

          return {
            sessions: {
              ...state.sessions,
              [agentId]: {
                ...session,
                messages: [...session.messages, errorMsg],
                status: "error",
                activeRunId: null,
              },
            },
          };
        });
        break;
      }

      default:
        break;
    }
  },

  disconnect: () => {
    get().client?.disconnect();
    set({ serverConnected: false, client: null });
  },

  setTheme: (themeId: string) => {
    set({ theme: themeId });
    const theme = themes[themeId];
    if (theme) {
      applyTheme(theme);
    }
  },
}));
