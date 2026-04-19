// ─── MultiClaw WebSocket Protocol Types ───

/** Server → Client frames */
export type ServerFrame =
  | { type: "connected" }
  | { type: "status"; agentId: string; runId: string; status: AgentStatus }
  | { type: "chunk"; agentId: string; runId: string; text: string }
  | { type: "tool_use"; agentId: string; runId: string; toolName: string }
  | { type: "result"; agentId: string; runId: string; text: string; stopReason?: string }
  | { type: "event"; agentId: string; runId: string; event: Record<string, unknown> }
  | { type: "error"; agentId: string; runId?: string; message: string }
  | { type: "session_init"; agentId: string; sessionId: string };

/** Client → Server frames */
export type ClientFrame =
  | { type: "send"; agentId: string; text: string };

// ─── Agent Types ───

export type AgentStatus =
  | "idle"
  | "streaming"
  | "thinking"
  | "tool_use"
  | "error"
  | "disconnected";

export interface AgentConfig {
  id: string;
  name: string;
  icon: string;
  accent: string;
  /** System prompt / context for the agent */
  context: string;
  /** Model override for this agent */
  model?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: number;
  /** If assistant is still streaming this message */
  streaming?: boolean;
  /** Run ID for tracking responses */
  runId?: string;
  /** Tool use metadata */
  toolUse?: {
    name: string;
    status: "running" | "done" | "error";
  };
}

export interface AgentSession {
  agentId: string;
  status: AgentStatus;
  messages: ChatMessage[];
  /** Current streaming run ID */
  activeRunId: string | null;
  /** Token count for this session (approximate) */
  tokenCount: number;
  /** Whether connected to the backend */
  connected: boolean;
  /** Agent SDK session ID for resumption */
  sessionId?: string;
}

// ─── Connection Config ───

export interface DeckConfig {
  /** Backend WebSocket URL */
  serverUrl: string;
  /** Agent definitions */
  agents: AgentConfig[];
}

// ─── Store Types ───

export interface DeckState {
  config: DeckConfig;
  sessions: Record<string, AgentSession>;
  /** Global connection status to backend */
  serverConnected: boolean;
  /** Column ordering (agent IDs) */
  columnOrder: string[];
}
