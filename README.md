# MultiClaude 🐙

**Communicate with many instances of Claude Code on a single adaptive dashboard.**

Run multiple [Claude Code](https://docs.anthropic.com/en/docs/claude-code) agent sessions side-by-side in a multi-column interface. Give each agent a different task and watch them all work on your codebase in parallel.

![MultiClaude](https://img.shields.io/badge/MultiClaude-Deck-blueviolet)
![Claude Code](https://img.shields.io/badge/Claude_Code-Agent_SDK-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Screenshots

![MultiClaude Dashboard](images/theme-1.png)
*Five Claude Code agents running in parallel, each with independent conversations*

![Theme Variants](images/theme-2.png)
*Full markdown rendering with syntax highlighting across all columns*

![Tool Use](images/theme-3.png)
*Agents using tools (Read, Edit, Bash, Grep) and streaming results in real-time*

![Dark Themes](images/theme-4.png)
*15 built-in dark themes — Dracula, Nord, Monokai, Cyberpunk, and more*

---

## What It Does

Each column is a **real Claude Code session**. Every agent can:

- Read, write, and edit files in your project
- Run shell commands
- Search your codebase (glob, grep)
- Search the web
- Maintain full conversation history with session resumption

You control them all from one dashboard. Send 5 different tasks, watch 5 agents work simultaneously.

### Example Use Cases

| Columns | Tasks |
|---------|-------|
| 3 agents | "Write tests" / "Add validation" / "Update docs" |
| 5 agents | Research, implement, review, test, deploy — full pipeline in parallel |
| 2 agents | One writes code, the other reviews it |

---

## Quick Start

### Prerequisites

| Requirement | Check | Install |
|------------|-------|---------|
| Node.js 18+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| Claude Code CLI | `claude --version` | `npm install -g @anthropic-ai/claude-code` |
| API Key | `echo $ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |

### Install & Run

```bash
git clone https://github.com/kellyclaudeai/multiclaude.git
cd multiclaude
npm install
```

**Start both servers** (recommended):

```bash
npm run dev:all
```

Or start them separately:

```bash
npm run dev:server   # Backend on port 3001
npm run dev          # Frontend on port 5173
```

Open **http://localhost:5173** — five agent columns, ready to go.

---

## Agent-Friendly Setup

**Copy-paste setup for Claude Code agents or any AI assistant helping with installation:**

```bash
# 1. Verify prerequisites
node --version    # Must be v18+
claude --version  # Must show Claude Code version

# 2. Verify API key
test -n "$ANTHROPIC_API_KEY" && echo "API key set" || echo "ERROR: Set ANTHROPIC_API_KEY"

# 3. Clone and install
git clone https://github.com/kellyclaudeai/multiclaude.git
cd multiclaude
npm install

# 4. Start backend (port 3001)
npx tsx server/index.ts &
sleep 3

# 5. Start frontend (port 5173)
npm run dev &
sleep 3

# 6. Verify both services
curl -s http://localhost:3001/ | grep -q '"status":"ok"' && echo "Backend: OK" || echo "Backend: FAILED"
curl -s http://localhost:5173/ | grep -q 'MultiClaude' && echo "Frontend: OK" || echo "Frontend: FAILED"

echo ""
echo "Open http://localhost:5173 in a browser"
```

### Troubleshooting Quick Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| "process exited with code 1" | API key missing | `export ANTHROPIC_API_KEY=sk-ant-...` |
| Port 3001 in use | Old server running | `lsof -ti:3001 \| xargs kill -9` |
| Port 5173 in use | Old frontend running | `lsof -ti:5173 \| xargs kill -9` |
| `claude` not found | CLI not installed | `npm install -g @anthropic-ai/claude-code` |
| `tsx` not found | Run via npx | `npx tsx server/index.ts` |
| Agents error immediately | CLI broken | Test directly: `claude -p "hello"` |
| Frontend blank page | Deps stale | `rm -rf node_modules && npm install` |
| "disconnected" in status bar | Backend not running | Start backend first: `npm run dev:server` |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Browser — http://localhost:5173                          │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Claude 1 │ │ Claude 2 │ │ Claude 3 │ │ Claude 4 │ ... │
│  │          │ │          │ │          │ │          │     │
│  │  input   │ │  input   │ │  input   │ │  input   │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       └──────┬──────┴──────┬─────┘            │           │
│              ▼             ▼                   ▼           │
│     ┌──────────────────────────────────────────────┐      │
│     │  Zustand Store  ←→  MultiClaude WS Client    │      │
│     └──────────────────────┬───────────────────────┘      │
└────────────────────────────┼──────────────────────────────┘
                             │  WebSocket
                             ▼
┌────────────────────────────────────────────────────────────┐
│  MultiClaude Backend — server/index.ts (port 3001)         │
│                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Session 1  │  │  Session 2  │  │  Session 3  │  ...    │
│  │  query()    │  │  query()    │  │  query()    │         │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘          │
│        └───────────┬────┘              │                  │
│                    ▼                   ▼                  │
│  ┌──────────────────────────────────────────────────┐     │
│  │  @anthropic-ai/claude-agent-sdk                  │     │
│  │                                                  │     │
│  │  Each session gets:                              │     │
│  │  • Read, Write, Edit     (file operations)       │     │
│  │  • Bash                  (shell commands)        │     │
│  │  • Glob, Grep            (codebase search)       │     │
│  │  • WebSearch, WebFetch   (web access)            │     │
│  │  • Session resumption    (multi-turn memory)     │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

```
You type a message
  → React component
    → Zustand store
      → WebSocket (ws://localhost:3001/ws)
        → Backend spawns query({ prompt, options })
          → Claude Code subprocess with full tool access
            → Streaming events back:
              status: "thinking"
              chunk: "Here is my analysis..."
              tool_use: "Read" / "Edit" / "Bash"
              result: "Done! Here's what I did..."
            → WebSocket
          → Store update
        → React re-render
      → Markdown + syntax highlighting
    → You see the response
```

### WebSocket Protocol

```
Client → Server:
  { type: "send", agentId: "agent-1", text: "Explain this codebase" }

Server → Client:
  { type: "connected" }
  { type: "status",       agentId, runId, status: "thinking" | "streaming" | "idle" }
  { type: "session_init", agentId, sessionId }
  { type: "chunk",        agentId, runId, text: "partial response..." }
  { type: "tool_use",     agentId, runId, toolName: "Read" }
  { type: "result",       agentId, runId, text: "final response" }
  { type: "error",        agentId, message: "what went wrong" }
```

---

## Features

### Multi-Agent Parallelism
Run 5+ independent Claude Code sessions simultaneously. Each column has its own conversation, its own session, its own tool access.

### Full Claude Code Tool Access
Every agent gets the complete Claude Code toolset:
- **Read / Write / Edit** — Full file system access
- **Bash** — Shell command execution
- **Glob / Grep** — Fast codebase search
- **WebSearch / WebFetch** — Internet access

### Session Resumption
Conversations are multi-turn. Send a follow-up message and the agent picks up right where it left off, with full context from previous turns.

### Real-Time Streaming
See responses as they arrive:
- **Thinking indicator** when the agent is reasoning
- **Tool use badges** when the agent reads files or runs commands
- **Streaming text** as the response is generated
- **Final result** rendered with full markdown

### 15 Dark Themes

| Theme | Style |
|-------|-------|
| Midnight (default) | Deep blue-black, cyan accents |
| Ocean Depths | Navy blue, aqua |
| Forest Night | Dark green, natural |
| Sunset Glow | Burgundy, orange |
| Slate Gray | Professional slate |
| Purple Haze | Deep purple, violet |
| Cyberpunk | Neon pink + cyan |
| Rose Garden | Burgundy, rose pink |
| Abyss | Ultra-dark black |
| OLED Black | Pure black |
| Darcula | JetBrains classic |
| Dracula | Popular palette |
| Nord | Arctic frost |
| Gruvbox Dark | Retro groove |
| Monokai | Classic editor |

Switch instantly via the theme selector in the top bar. Preference persists in localStorage.

### Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line in input |
| `Tab` / `Shift+Tab` | Next / previous column |
| `Cmd+1` – `Cmd+9` | Jump to column 1–9 |
| `Cmd+K` | Add new agent column |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `PORT` | `3001` | Backend server port |
| `MULTICLAUDE_CWD` | `process.cwd()` | Working directory for all agents |
| `VITE_SERVER_URL` | `ws://127.0.0.1:3001/ws` | Backend WebSocket URL |

### Point Agents at a Different Project

```bash
MULTICLAUDE_CWD=/path/to/your/project npx tsx server/index.ts
```

### Change Default Column Count

Edit `src/App.tsx`, line with `buildDefaultAgents(5)` — change `5` to any number.

### URL Parameters

Override the backend URL via query string:
```
http://localhost:5173/?server=ws://other-host:3001/ws
```

---

## Project Structure

```
multiclaude/
├── server/
│   ├── index.ts              # Backend: WS server + Claude Agent SDK
│   └── tsconfig.json
├── src/
│   ├── components/
│   │   ├── AgentColumn.tsx   # Chat column (messages + input + status)
│   │   ├── TopBar.tsx        # Header (logo, tabs, stats, theme)
│   │   ├── StatusBar.tsx     # Footer (connection status, version)
│   │   ├── AddAgentModal.tsx # New agent dialog
│   │   └── ThemeSwitcher.tsx # Theme dropdown
│   ├── lib/
│   │   ├── multiclaude-client.ts  # WebSocket client
│   │   └── store.ts               # Zustand state management
│   ├── hooks/index.ts        # React hooks
│   ├── types/index.ts        # TypeScript protocol + UI types
│   ├── themes.ts             # 15 theme definitions
│   ├── App.tsx               # Root component
│   ├── App.css               # Global styles
│   └── main.tsx              # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Frontend dev server (port 5173) |
| `npm run dev:server` | Backend server (port 3001) |
| `npm run dev:all` | Both servers together |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.7, Vite 6 |
| State | Zustand 5 |
| Rendering | react-markdown, remark-gfm, rehype-highlight |
| Backend | Node.js, ws (WebSocket) |
| Agent SDK | @anthropic-ai/claude-agent-sdk |
| Dev | tsx, concurrently |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and verify: `npx tsc --noEmit && npm run build`
4. Commit with a clear message
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE)
