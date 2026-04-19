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
    const agentId = i === 0 ? "agent-1" : `agent-${i + 1}`;
    const agentName = i === 0 ? "Claude 1" : `Claude ${i + 1}`;

    return {
      id: agentId,
      name: agentName,
      icon: String(i + 1),
      accent: AGENT_ACCENTS[i % AGENT_ACCENTS.length],
      context: "",
      model: "claude-opus-4-6",
    };
  });
}

function getServerConfig() {
  const params = new URLSearchParams(window.location.search);
  let serverUrl =
    params.get("server") ||
    import.meta.env.VITE_SERVER_URL ||
    "ws://127.0.0.1:3001/ws";

  // Resolve relative paths (e.g. "/ws") to full WebSocket URLs
  if (serverUrl.startsWith("/")) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    serverUrl = `${proto}//${window.location.host}${serverUrl}`;
  }

  return { serverUrl };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("All Agents");
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialAgents] = useState<AgentConfig[]>(() =>
    buildDefaultAgents(5)
  );
  const columnOrder = useDeckStore((s) => s.columnOrder);
  const addAgent = useDeckStore((s) => s.addAgent);
  const theme = useDeckStore((s) => s.theme);

  const { serverUrl } = getServerConfig();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const selectedTheme = themes[theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [theme]);

  useDeckInit({
    serverUrl,
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
          onCreate={async (agent) => addAgent(agent)}
        />
      )}
    </div>
  );
}
