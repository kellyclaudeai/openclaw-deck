import type { AgentConfig } from "../types";

// Fallback model if gateway fetch fails
export const FALLBACK_MODEL = "claude-sonnet-4-5";

// Fallback models list for AddAgentModal
export const FALLBACK_MODELS = [
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
];

export interface GatewayInfo {
  defaultModel: string;
  availableModels: Array<{ id: string; name: string }>;
}

/**
 * Fetch gateway configuration including available models.
 * Falls back to hardcoded defaults if fetch fails.
 */
export async function fetchGatewayConfig(
  gatewayUrl: string,
  token?: string
): Promise<GatewayInfo> {
  try {
    // Use relative path to go through Vite proxy and avoid CORS
    const configUrl = "/config";

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(configUrl, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const config = await response.json();

    // Extract models from gateway config
    const models = config.agents?.defaults?.models || {};
    const modelList = Object.entries(models).map(([id, info]: [string, unknown]) => {
      const modelInfo = info as { alias?: string };
      return {
        id,
        name: modelInfo.alias || id.split("/").pop() || id,
      };
    });

    // Get default model from primary config
    const defaultModel =
      config.agents?.defaults?.model?.primary ||
      modelList[0]?.id ||
      FALLBACK_MODEL;

    return {
      defaultModel,
      availableModels: modelList.length > 0 ? modelList : FALLBACK_MODELS,
    };
  } catch (err) {
    console.warn("[GatewayConfig] Failed to fetch, using fallback:", err);
    return {
      defaultModel: FALLBACK_MODEL,
      availableModels: FALLBACK_MODELS,
    };
  }
}

/**
 * Build default agents with dynamic model from gateway config.
 */
export function buildDefaultAgents(
  count: number,
  defaultModel: string = FALLBACK_MODEL
): AgentConfig[] {
  const AGENT_ACCENTS = [
    "#22d3ee",
    "#a78bfa",
    "#34d399",
    "#f59e0b",
    "#f472b6",
    "#60a5fa",
    "#facc15",
    "#fb7185",
    "#4ade80",
    "#c084fc",
    "#f97316",
    "#2dd4bf",
  ];

  return Array.from({ length: count }, (_, i) => {
    const agentId = i === 0 ? "main" : `agent-${i + 1}`;
    const agentName = i === 0 ? "Main" : `Agent ${i + 1}`;

    return {
      id: agentId,
      name: agentName,
      icon: String(i + 1),
      accent: AGENT_ACCENTS[i % AGENT_ACCENTS.length],
      context: "",
      model: defaultModel,
    };
  });
}
