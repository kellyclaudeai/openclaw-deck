import { useEffect, useRef, useCallback } from "react";
import { useDeckStore } from "../lib/store";
import type { AgentConfig, DeckConfig } from "../types";

/**
 * Initialize the deck with config. Call once at app root.
 * Now properly handles dynamic agent updates including model changes.
 */
export function useDeckInit(config: Partial<DeckConfig>) {
  const initialize = useDeckStore((s) => s.initialize);
  const disconnect = useDeckStore((s) => s.disconnect);
  const prevAgentsRef = useRef<string>("");

  // Get a stable key for the agents array to detect changes (including model changes)
  const agentsKey = config.agents?.map(a => `${a.id}:${a.model}`).join(",") || "";

  useEffect(() => {
    // Only re-initialize if agents have actually changed (including model)
    if (prevAgentsRef.current !== agentsKey) {
      prevAgentsRef.current = agentsKey;
      
      // If we have agents, initialize (or re-initialize) the store
      if (config.agents && config.agents.length > 0) {
        initialize(config);
      }
    }

    return () => {
      disconnect();
    };
  }, [agentsKey, config.gatewayUrl, config.token]); // Re-run when agents or connection changes
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
  const connected = useDeckStore((s) => s.gatewayConnected);

  const agents = Object.values(sessions);
  const streaming = agents.filter((a) => a.status === "streaming").length;
  const thinking = agents.filter((a) => a.status === "thinking").length;
  const errors = agents.filter((a) => a.status === "error").length;
  const totalTokens = agents.reduce(
    (sum, a) => sum + (a.usage?.totalTokens ?? a.tokenCount),
    0
  );
  const waitingForUser = agents.filter((a) => {
    if (a.status !== "idle" || a.messages.length === 0) return false;
    const last = a.messages[a.messages.length - 1];
    return last.role === "assistant" && !last.streaming;
  }).length;

  return {
    gatewayConnected: connected,
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
