import { useState, useEffect } from "react";
import { useDeckInit } from "./hooks";
import { useDeckStore } from "./lib/store";
import { AgentColumn } from "./components/AgentColumn";
import { TopBar } from "./components/TopBar";
import { StatusBar } from "./components/StatusBar";
import { AddAgentModal } from "./components/AddAgentModal";
import type { AgentConfig } from "./types";
import { themes, applyTheme } from "./themes";
import { fetchGatewayConfig, buildDefaultAgents } from "./lib/gateway-config";
import "./App.css";

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
  const [initialAgents, setInitialAgents] = useState<AgentConfig[]>([]);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([]);
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const columnOrder = useDeckStore((s) => s.columnOrder);
  const createAgentOnGateway = useDeckStore((s) => s.createAgentOnGateway);
  const theme = useDeckStore((s) => s.theme);

  const { gatewayUrl, token } = getGatewayConfig();

  // Fetch gateway config on mount
  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      const config = await fetchGatewayConfig(gatewayUrl, token);
      if (!mounted) return;

      setDefaultModel(config.defaultModel);
      setAvailableModels(config.availableModels);
      // Create agents with fetched config
      const agents = buildDefaultAgents(7, config.defaultModel);
      setInitialAgents(agents);
      setIsLoading(false);
    }

    // Load config first, then create agents (no fallback needed since /config is local)
    loadConfig();

    return () => {
      mounted = false;
    };
  }, [gatewayUrl, token]);

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

  if (isLoading) {
    return (
      <div className="deck-root">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          Loading gateway configuration...
        </div>
      </div>
    );
  }

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
          availableModels={availableModels}
          defaultModel={defaultModel}
        />
      )}
    </div>
  );
}
