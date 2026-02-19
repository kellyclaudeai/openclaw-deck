# OpenClaw Deck 🦞

A multi-column chat interface for [OpenClaw](https://openclaw.ai) agents. Chat with multiple AI agents side-by-side in a clean, responsive deck layout.

![OpenClaw Deck](https://img.shields.io/badge/OpenClaw-Deck-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Multi-column layout** — Chat with 7 agents simultaneously by default
- **11 Beautiful Themes** — Dark themes from Midnight to Monokai, including popular editor themes (Darcula, Dracula, Nord, Gruvbox)
- **Markdown rendering** — Full markdown support with syntax highlighting
- **Keyboard navigation** — Fast switching between columns (Tab, Cmd+1-9, Cmd+K)
- **Real-time WebSocket** — Live connection to OpenClaw Gateway
- **Clean UI** — Compact, readable design optimized for productivity

## Screenshots

![Theme Example 1](images/theme-1.png)
*OpenClaw Deck with dark theme - Multi-column chat interface*

![Theme Example 2](images/theme-2.png)
*Different theme variant showing markdown rendering*

![Theme Example 3](images/theme-3.png)
*Another theme with active conversations*

![Theme Example 4](images/theme-4.png)
*Additional theme showcasing the interface*

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Themes](#themes)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Check your version: `node --version`
   - Install from: https://nodejs.org/
   - Recommended: Use [nvm](https://github.com/nvm-sh/nvm) for version management

2. **OpenClaw Gateway** (running locally)
   - Install OpenClaw: https://openclaw.ai
   - Or via npm: `npm install -g openclaw`
   - Verify installation: `openclaw --version`

3. **Git** (for cloning)
   - Check: `git --version`
   - Install: https://git-scm.com/

### Optional Tools

- **GitHub CLI** (`gh`) for easier repo management
- A modern browser (Chrome, Firefox, Safari, Edge)

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/kellyclaudeai/openclaw-deck.git
cd openclaw-deck
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- React, TypeScript, and Vite (core framework)
- Zustand (state management)
- react-markdown and highlight.js (rendering)
- All other required packages

**Expected output:**
```
added 170 packages, and audited 171 packages in 8s
```

If you see any warnings about vulnerabilities, they're typically safe to ignore for development.

---

## Configuration

### Step 1: Start OpenClaw Gateway

Before configuring the Deck, ensure your OpenClaw Gateway is running:

```bash
# Check if OpenClaw is installed
openclaw --version

# Check gateway status
openclaw status

# If not running, start it
openclaw gateway start
```

**Expected output:**
```
✓ Gateway running at ws://127.0.0.1:18789
✓ Status: healthy
```

### Step 2: Get Your Gateway Token

Your gateway token is required for authentication:

```bash
openclaw config get gateway.token
```

**Example output:**
```
5fd19a1df600fdb1968fadd098b8a7f376a826a7f64ae51f
```

**Copy this token** — you'll need it in the next step.

### Step 3: Create Environment File

```bash
cp .env.example .env
```

Edit the `.env` file:

```bash
# Use your preferred editor
nano .env
# or
code .env
# or
vim .env
```

Update with your token:

```env
VITE_GATEWAY_URL=ws://127.0.0.1:18789
VITE_GATEWAY_TOKEN=your_actual_token_here
```

**Important:**
- Replace `your_actual_token_here` with the token from Step 2
- Do not commit this file to git (it's in `.gitignore`)
- The gateway URL should match your OpenClaw setup (default is usually correct)

---

## Running the Application

### Development Mode (Recommended)

Start the Vite dev server with hot-reload:

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.4.1  ready in 423 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Open your browser** to http://localhost:5173

You should see 7 agent columns load. If input fields are enabled, you're connected successfully!

### Production Build

For deployment or testing the production build:

```bash
npm run build
npm run preview
```

The build output will be in `dist/` and preview will run at http://localhost:4173

---

## Updating OpenClaw Deck

To update to the latest version:

```bash
cd ~/openclaw-deck

# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Restart the dev server
npm run dev
```

### If you get conflicts during `git pull`:

```bash
# Stash local changes first
git stash

# Pull again
git pull origin main

# Reapply your changes (optional)
git stash pop
```

### If the dev server was already running:

- Kill the old process first (Ctrl+C in the terminal, or `pkill -f "openclaw-deck"`)
- Then restart with `npm run dev`

### Check for breaking changes:

- Look for any `CHANGELOG.md` or `MIGRATION.md` files after pulling
- Check the terminal output when `npm install` runs for deprecation warnings

**Update time:** ~30 seconds unless there are conflicts or major dependency updates.

---

## Usage

### Basic Chat

1. **Click or Tab** into any agent column input field
2. **Type your message** and press Enter
3. Watch the agent respond in real-time with streaming output
4. **Markdown is rendered** automatically (headers, lists, code blocks, etc.)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next column input |
| `Shift+Tab` | Move to previous column input |
| `Cmd+1` through `Cmd+9` | Jump directly to column 1-9 |
| `Cmd+K` | Open "Add Agent" modal |
| `Enter` | Send message (when in input field) |

### Agent Columns

Each column represents an independent agent conversation:
- **Labeled 1-7** for quick reference
- **Color-coded** for visual distinction
- **Independent scroll** — scroll one column without affecting others
- **Persistent** — messages remain until you clear them

### Message Display

- **Your messages** appear in a smaller, monospace font with a cyan tint
- **Agent responses** appear larger with markdown formatting:
  - Headers (`#`, `##`, `###`)
  - Lists (bulleted and numbered)
  - Code blocks with syntax highlighting
  - Inline code, quotes, tables, and more

---

## Themes

OpenClaw Deck comes with **11 beautiful dark themes** inspired by popular code editors and color schemes. Switch themes instantly using the theme selector in the top right corner.

### Available Themes

| Theme | Description |
|-------|-------------|
| **Midnight** | Deep blue-black with subtle cyan accents (default) |
| **Ocean Depths** | Navy blue inspired by ocean depths |
| **Forest Night** | Dark green forest theme |
| **Sunset Glow** | Warm burgundy with orange highlights |
| **Slate Gray** | Professional slate blue |
| **Purple Haze** | Deep purple with violet accents |
| **Cyberpunk** | Neon pink and cyan on dark blue |
| **Rose Garden** | Burgundy with rose pink highlights |
| **Abyss** | Ultra-dark theme (true black) |
| **Darcula** | JetBrains IDE classic theme |
| **Dracula** | The popular Dracula color scheme |
| **Nord** | Arctic-inspired frost palette |
| **Gruvbox Dark** | Retro groove color scheme |
| **Monokai** | Classic Monokai editor theme |

### Switching Themes

1. Look for the **theme icon** (🎨) in the top right corner of the interface
2. Click to open the theme selector dropdown
3. Choose any theme — changes apply instantly
4. Your preference is saved automatically in browser storage

### Theme Persistence

Your selected theme is stored in `localStorage` and persists across:
- Browser refreshes
- Closing and reopening tabs
- Gateway restarts

No configuration needed — just pick your favorite and start chatting.

---

## Troubleshooting

### Connection Issues

#### Problem: "WebSocket error" or "Handshake failed"

**Symptoms:**
- All input fields are disabled/grayed out
- Status bar shows connection error
- Console shows WebSocket errors

**Solutions:**

1. **Verify Gateway is Running**
   ```bash
   openclaw status
   ```
   If not running:
   ```bash
   openclaw gateway start
   ```

2. **Check Your Token**
   ```bash
   # Get current token
   openclaw config get gateway.token
   
   # Compare with your .env file
   cat .env | grep VITE_GATEWAY_TOKEN
   ```
   
   If they don't match, update `.env` with the correct token.

3. **Verify Gateway URL**
   Most setups use `ws://127.0.0.1:18789`, but check your OpenClaw config:
   ```bash
   openclaw config get gateway.port
   ```
   
   If different, update `VITE_GATEWAY_URL` in `.env`

4. **Restart Dev Server**
   After changing `.env`, stop the dev server (Ctrl+C) and restart:
   ```bash
   npm run dev
   ```

#### Problem: "Token missing" or "Unauthorized"

**Solution:**
Your `.env` file is likely missing or has an incorrect token.

1. Verify `.env` exists:
   ```bash
   ls -la .env
   ```

2. Check token format (should be a long hex string):
   ```bash
   cat .env
   ```

3. Regenerate if needed:
   ```bash
   openclaw gateway restart
   openclaw config get gateway.token
   ```

### Display Issues

#### Problem: White Screen or Blank Page

**Solutions:**

1. **Check Browser Console**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Look for JavaScript errors
   - Common issues: CORS errors, module loading failures

2. **Clear Browser Cache**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
   - Or clear cache in browser settings

3. **Verify Build**
   ```bash
   rm -rf dist node_modules
   npm install
   npm run dev
   ```

#### Problem: Can't Type in Input Fields (Disabled)

**Cause:** Gateway connection failed (see [Connection Issues](#connection-issues))

**Quick check:**
Look at the status bar at the bottom of the page. It should show a green indicator when connected.

#### Problem: Markdown Not Rendering

**Solution:**
This is a known issue in some browsers with strict content security policies.

1. Try a different browser (Chrome works best)
2. Check browser console for CSP errors
3. Ensure you're on the latest version:
   ```bash
   git pull origin master
   npm install
   ```

### Performance Issues

#### Problem: Slow or Laggy UI

**Solutions:**

1. **Reduce Active Columns**
   Edit `src/App.tsx` and change:
   ```typescript
   buildDefaultAgents(7)  // Change to 3 or 4
   ```

2. **Disable Syntax Highlighting**
   If code blocks are causing lag, you can disable highlighting by commenting out the import in `src/components/AgentColumn.tsx`:
   ```typescript
   // import "highlight.js/styles/github-dark.css";
   ```

3. **Check Gateway Health**
   ```bash
   openclaw doctor
   ```

### Installation Issues

#### Problem: `npm install` Fails

**Solutions:**

1. **Check Node Version**
   ```bash
   node --version
   ```
   Must be v18 or higher. Upgrade if needed.

2. **Clear npm Cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Try Different Registry**
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

---

## Development

### Project Structure

```
openclaw-deck/
├── src/
│   ├── components/          # React UI components
│   │   ├── AgentColumn.tsx        # Individual agent chat column
│   │   ├── TopBar.tsx             # Header with navigation
│   │   ├── StatusBar.tsx          # Connection status footer
│   │   └── AddAgentModal.tsx      # Agent creation dialog
│   ├── lib/                 # Core libraries
│   │   ├── gateway-client.ts      # WebSocket client for OpenClaw Gateway
│   │   └── store.ts               # Zustand state management
│   ├── hooks/               # React hooks
│   │   └── index.ts               # Custom hooks (useAgentSession, etc.)
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts               # AgentConfig, Message, etc.
│   ├── App.tsx              # Main application component
│   ├── App.css              # Global styles
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── dist/                    # Build output (gitignored)
├── .env                     # Environment config (gitignored)
├── .env.example             # Example environment config
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── README.md                # This file
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Building
npm run build        # Production build to dist/
npm run preview      # Preview production build locally

# Code Quality
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint (if configured)

# Maintenance
npm run clean        # Remove dist/ and node_modules/
```

### Making Changes

#### Customizing Agent Colors

Edit `src/App.tsx`:

```typescript
const AGENT_ACCENTS = [
  "#22d3ee",  // cyan
  "#a78bfa",  // purple
  "#34d399",  // green
  "#f59e0b",  // orange
  "#f472b6",  // pink
  "#60a5fa",  // blue
  "#facc15",  // yellow
  // Add more colors here
];
```

#### Changing Default Column Count

Edit `src/App.tsx`:

```typescript
const [initialAgents] = useState<AgentConfig[]>(() =>
  buildDefaultAgents(7)  // Change this number
);
```

#### Customizing Message Styles

Edit `src/components/AgentColumn.module.css`:

```css
/* User messages */
.userMsg .messageText {
  font-size: 12px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.86);
  /* Customize here */
}

/* Assistant messages */
.assistantMsg .messageText {
  line-height: 1.22;
  /* Customize here */
}
```

---

## Architecture

### Data Flow

```
User Input
    ↓
AgentColumn Component
    ↓
useSendMessage Hook
    ↓
GatewayClient (WebSocket)
    ↓
OpenClaw Gateway
    ↓
AI Model (Claude, GPT, etc.)
    ↓
Gateway Response (streaming)
    ↓
GatewayClient (WebSocket)
    ↓
Zustand Store Update
    ↓
React Re-render
    ↓
Message Display (Markdown)
```

### State Management

The app uses **Zustand** for state management:

- `useDeckStore` — Global store for all agent sessions
- Each agent has:
  - `messages[]` — Chat history
  - `isStreaming` — Current streaming state
  - `gatewayConnected` — Connection status

### WebSocket Connection

The `GatewayClient` (`src/lib/gateway-client.ts`) handles:

1. **Authentication** — Token-based handshake with Gateway
2. **Message Routing** — Sending user input, receiving agent responses
3. **Streaming** — Real-time token streaming from AI responses
4. **Reconnection** — Automatic reconnect on connection loss

### Rendering Pipeline

1. User types message and presses Enter
2. Message added to local state immediately (optimistic update)
3. WebSocket sends message to Gateway
4. Gateway streams response back in chunks
5. Each chunk triggers a React state update
6. `react-markdown` renders the accumulated text
7. `highlight.js` applies syntax highlighting to code blocks

---

## Agent-Friendly Setup Instructions

**If you're an AI agent helping someone set up OpenClaw Deck, use these exact steps:**

```bash
# 1. Verify prerequisites
node --version  # Should be v18+
openclaw --version  # Should show OpenClaw is installed

# 2. Start OpenClaw Gateway (if not running)
openclaw gateway start
openclaw status  # Verify it's running

# 3. Get gateway token
export GATEWAY_TOKEN=$(openclaw config get gateway.token)
echo "Gateway token: $GATEWAY_TOKEN"

# 4. Clone and setup
git clone https://github.com/kellyclaudeai/openclaw-deck.git
cd openclaw-deck
npm install

# 5. Configure environment
cat > .env << EOF
VITE_GATEWAY_URL=ws://127.0.0.1:18789
VITE_GATEWAY_TOKEN=$GATEWAY_TOKEN
EOF

# 6. Start dev server
npm run dev

# 7. Open browser
echo "✓ Setup complete! Open http://localhost:5173 in your browser"
```

**Expected result:** Browser opens with 7 agent columns, all input fields enabled and ready for messages.

**If there are errors:**
1. Check that gateway is running: `openclaw status`
2. Verify token in `.env` matches: `openclaw config get gateway.token`
3. Check browser console for specific errors (F12)
4. Try restarting dev server: Stop with Ctrl+C, then `npm run dev` again

---

## Contributing

Contributions are welcome! Here's how to contribute:

### Reporting Issues

1. Check [existing issues](https://github.com/kellyclaudeai/openclaw-deck/issues)
2. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

### Submitting Changes

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openclaw-deck.git
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test thoroughly
5. **Commit** with clear messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub

### Development Guidelines

- Follow existing code style (TypeScript + React best practices)
- Add comments for complex logic
- Test in multiple browsers if changing UI
- Update README if adding features or changing setup
- Keep commits focused and atomic

---

## FAQ

### Can I use this with a remote OpenClaw Gateway?

Yes! Update `VITE_GATEWAY_URL` in `.env`:

```env
VITE_GATEWAY_URL=wss://your-gateway-domain.com
VITE_GATEWAY_TOKEN=your_remote_token
```

Note: Use `wss://` for secure connections over HTTPS.

### Can I run more than 7 columns?

Yes, edit `src/App.tsx` and change the number in `buildDefaultAgents(7)`.

### Does this work with self-hosted OpenClaw?

Yes! As long as your OpenClaw Gateway is accessible, the Deck will work.

### Can I customize the agent models?

Yes, but you need to configure models in your OpenClaw Gateway settings. The Deck connects to whatever agents are configured in your gateway.

### Is there a Docker version?

Not yet, but contributions welcome! The current setup is optimized for local development.

### Can I deploy this to production?

Yes:
1. Run `npm run build`
2. Deploy the `dist/` folder to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
3. Configure your environment variables in the hosting platform
4. Ensure your OpenClaw Gateway is accessible from the deployed URL

---

## License

MIT License - see [LICENSE](LICENSE) file for details

## Related Projects

- [OpenClaw](https://github.com/openclaw/openclaw) — The main OpenClaw project
- [OpenClaw Docs](https://docs.openclaw.ai) — Official documentation
- [ClawHub](https://clawhub.com) — Community skills and tools

## Acknowledgments

Built with ❤️ for the OpenClaw community by [@kellyclaudeai](https://github.com/kellyclaudeai)

Special thanks to all contributors and the OpenClaw team.

---

## Support

- **Documentation:** This README + [OpenClaw Docs](https://docs.openclaw.ai)
- **Issues:** [GitHub Issues](https://github.com/kellyclaudeai/openclaw-deck/issues)
- **Community:** [OpenClaw Discord](https://discord.com/invite/clawd)

**Need help?** Open an issue with the `question` label and include:
- What you're trying to do
- What's happening instead
- Relevant error messages or screenshots
- Your environment (OS, Node version, OpenClaw version)
