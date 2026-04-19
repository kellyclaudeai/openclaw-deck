import { useEffect, useRef, useCallback } from "react";
import { useDeckStore } from "../lib/store";
import type { AgentConfig, DeckConfig } from "../types";

/**
 * Initialize the deck with config. Call once at app root.
 */
export function useDeckInit(config: Partial<DeckConfig>) {
  const initialize = useDeckStore((s) => s.initialize);
  const disconnect = useDeckStore((s) => s.disconnect);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize(config);
    }
    return () => {
      initialized.current = false;
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Get session data for a specific agent.
 */
export function useAgentSession(agentId: string) {
  return useDeckStore((s) => s.sessions[agentId]);
}

/**
 * Get the agent config by ID.
 */
export function useAgentConfig(agentId: string): AgentConfig | undefined {
  return useDeckStore((s) => s.config.agents.find((a) => a.id === agentId));
}

/**
 * Send a message to an agent. Returns a stable callback.
 */
export function useSendMessage(agentId: string) {
  const sendMessage = useDeckStore((s) => s.sendMessage);
  return useCallback(
    (text: string) => sendMessage(agentId, text),
    [agentId, sendMessage]
  );
}

/**
 * Auto-scroll a container to bottom when content changes.
 */
export function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [dep]);

  return ref;
}

/**
 * Get global deck stats.
 */
export function useDeckStats() {
  const sessions = useDeckStore((s) => s.sessions);
  const connected = useDeckStore((s) => s.serverConnected);

  const agents = Object.values(sessions);
  const streaming = agents.filter((a) => a.status === "streaming").length;
  const thinking = agents.filter((a) => a.status === "thinking").length;
  const errors = agents.filter((a) => a.status === "error").length;
  const totalTokens = agents.reduce((sum, a) => sum + a.tokenCount, 0);
  const waitingForUser = agents.filter((a) => {
    if (a.status !== "idle" || a.messages.length === 0) return false;
    const last = a.messages[a.messages.length - 1];
    return last.role === "assistant" && !last.streaming;
  }).length;

  return {
    serverConnected: connected,
    totalAgents: agents.length,
    streaming,
    thinking,
    active: streaming + thinking,
    idle: agents.length - streaming - thinking,
    errors,
    totalTokens,
    waitingForUser,
  };
}
