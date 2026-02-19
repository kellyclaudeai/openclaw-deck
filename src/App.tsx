import { useState, useEffect } from "react";
import { useDeckInit } from "./hooks";
import { useDeckStore } from "./lib/store";
import { AgentColumn } from "./components/AgentColumn";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { AddAgentModal } from "./components/AddAgentModal";
import type { AgentConfig } from "./types";
import { themes, applyTheme } from "./themes";
import "./App.css";

/**
 * Agent column configuration.
 *
 * You're running default single-agent mode, so there's one agent: "main".
 * The Gateway routes all messages to the default workspace at:
 *   /Users/austenallred/.openclaw/workspace
 *
 * To add more columns later, set up multi-agent in openclaw.json:
 *   { "agents": { "list": [
 *     { "id": "research", "workspace": "~/.openclaw/workspace-research" },
 *     { "id": "codegen",  "workspace": "~/.openclaw/workspace-codegen" },
 *   ]}}
 *
 * Then add matching entries here.
 */
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

function buildDefaultAgents(count: number): AgentConfig[] {
  return Array.from({ length: count }, (_, i) => {
    // First agent uses "main" (default agent in OpenClaw)
    const agentId = i === 0 ? "main" : `agent-${i + 1}`;
    const agentName = i === 0 ? "Assistant" : `Agent ${i + 1}`;

    return {
      id: agentId,
      name: agentName,
      icon: i === 0 ? "A" : String(i + 1),
      accent: AGENT_ACCENTS[i % AGENT_ACCENTS.length],
      context: "",
      model: "claude-sonnet-4-5",
    };
  });
}

function getGatewayConfig() {
  const params = new URLSearchParams(window.location.search);
  let gatewayUrl =
    params.get("gateway") ||
    import.meta.env.VITE_GATEWAY_URL ||
    "ws://127.0.0.1:18789";

  // Resolve relative paths (e.g. "/ws") to full WebSocket URLs
  if (gatewayUrl.startsWith("/")) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    gatewayUrl = `${proto}//${window.location.host}${gatewayUrl}`;
  }

  return {
    gatewayUrl,
    token:
      params.get("token") ||
      import.meta.env.VITE_GATEWAY_TOKEN ||
      undefined,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("All Agents");
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialAgents] = useState<AgentConfig[]>(() =>
    buildDefaultAgents(7)
  );
  const columnOrder = useDeckStore((s) => s.columnOrder);
  const createAgentOnGateway = useDeckStore((s) => s.createAgentOnGateway);
  const theme = useDeckStore((s) => s.theme);

  const { gatewayUrl, token } = getGatewayConfig();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const selectedTheme = themes[theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [theme]);

  useDeckInit({
    gatewayUrl,
    token,
    agents: initialAgents,
  });

  // Cmd+1-9 to focus column inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        const index = parseInt(e.key, 10) - 1;
        const input = document.querySelector<HTMLTextAreaElement>(
          `[data-deck-input="${index}"]`
        );
        if (input) {
          e.preventDefault();
          input.focus();
        }
      } else if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setShowAddModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="deck-root">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddAgent={() => setShowAddModal(true)}
      />

      <div className="deck-columns">
        {columnOrder.map((agentId, index) => (
          <AgentColumn key={agentId} agentId={agentId} columnIndex={index} />
        ))}
      </div>

      <StatusBar />

      {showAddModal && (
        <AddAgentModal
          onClose={() => setShowAddModal(false)}
          onCreate={createAgentOnGateway}
        />
      )}
    </div>
  );
}
