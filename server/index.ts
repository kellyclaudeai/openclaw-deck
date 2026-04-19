/**
 * MultiClaude Backend Server
 *
 * WebSocket server that manages multiple Claude Code agent sessions.
 * Each agent column in the frontend maps to an independent Agent SDK session.
 *
 * Protocol (client → server):
 *   { type: "send", agentId, text }
 *
 * Protocol (server → client):
 *   { type: "connected" }
 *   { type: "status", agentId, runId, status }
 *   { type: "result", agentId, runId, text }
 *   { type: "event",  agentId, runId, event }
 *   { type: "error",  agentId, runId?, message }
 */

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { query } from "@anthropic-ai/claude-agent-sdk";

const PORT = parseInt(process.env.PORT || "3001", 10);
const CWD = process.env.MULTICLAUDE_CWD || process.cwd();

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", agents: agentSessions.size }));
});

const wss = new WebSocketServer({ server, path: "/ws" });

// Map agentId → sessionId for conversation resumption
const agentSessions = new Map<string, string>();

function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

wss.on("connection", (ws) => {
  console.log("[MultiClaude] Client connected");
  send(ws, { type: "connected" });

  ws.on("message", async (raw) => {
    let msg: { type: string; [k: string]: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "send") {
      const agentId = msg.agentId as string;
      const text = msg.text as string;
      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const existingSession = agentSessions.get(agentId);

      send(ws, { type: "status", agentId, runId, status: "thinking" });

      try {
        const opts: Record<string, unknown> = {
          allowedTools: [
            "Read",
            "Write",
            "Edit",
            "Bash",
            "Glob",
            "Grep",
            "WebSearch",
            "WebFetch",
          ],
          permissionMode: "acceptEdits",
          cwd: CWD,
          maxTurns: 50,
        };

        if (existingSession) {
          opts.resume = existingSession;
        }

        for await (const message of query({ prompt: text, options: opts })) {
          const m = message as Record<string, unknown>;

          // Capture session ID for future resumption
          if (m.type === "system" && m.subtype === "init" && m.session_id) {
            agentSessions.set(agentId, m.session_id as string);
            send(ws, {
              type: "session_init",
              agentId,
              sessionId: m.session_id,
            });
          }

          // Assistant message with streaming content
          if (m.type === "assistant") {
            const msg = m.message as Record<string, unknown> | undefined;
            const content = msg?.content as Array<Record<string, unknown>> | undefined;
            if (content) {
              for (const block of content) {
                if (block.type === "text" && block.text) {
                  send(ws, {
                    type: "chunk",
                    agentId,
                    runId,
                    text: block.text as string,
                  });
                } else if (block.type === "tool_use") {
                  send(ws, {
                    type: "tool_use",
                    agentId,
                    runId,
                    toolName: block.name as string,
                  });
                }
              }
            }
            send(ws, { type: "status", agentId, runId, status: "streaming" });
          }
          // Final result
          else if ("result" in m) {
            send(ws, {
              type: "result",
              agentId,
              runId,
              text: m.result,
              stopReason: m.stop_reason,
            });
          } else {
            // Forward everything else as a generic event
            send(ws, { type: "event", agentId, runId, event: m });
          }
        }

        send(ws, { type: "status", agentId, runId, status: "idle" });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        console.error(`[MultiClaude] Agent ${agentId} error:`, message);
        send(ws, { type: "error", agentId, runId, message });
        send(ws, { type: "status", agentId, runId, status: "error" });
      }
    }
  });

  ws.on("close", () => {
    console.log("[MultiClaude] Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`\n  🐙 MultiClaude server listening on http://localhost:${PORT}`);
  console.log(`  📂 Working directory: ${CWD}\n`);
});
