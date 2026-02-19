import { useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  useAgentSession,
  useAgentConfig,
  useSendMessage,
  useAutoScroll,
} from "../hooks";
import { useDeckStore } from "../lib/store";
import type { AgentStatus, ChatMessage, AgentSession } from "../types";
import styles from "./AgentColumn.module.css";

// ─── Status Indicator ───

function StatusBadge({
  status,
  accent,
}: {
  status: AgentStatus;
  accent: string;
}) {
  const color =
    status === "streaming" || status === "thinking" || status === "tool_use"
      ? accent
      : status === "error"
        ? "#ef4444"
        : status === "disconnected"
          ? "#6b7280"
          : "rgba(255,255,255,0.25)";

  const label =
    status === "tool_use" ? "tool use" : status;

  const isActive =
    status === "streaming" || status === "thinking" || status === "tool_use";

  return (
    <div className={styles.statusBadge}>
      <div
        className={isActive ? styles.statusDotPulse : styles.statusDot}
        style={{ backgroundColor: color }}
      />
      <span className={styles.statusLabel} style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── Message Bubble ───

function MessageBubble({
  message,
  accent,
}: {
  message: ChatMessage;
  accent: string;
}) {
  const isUser = message.role === "user";

  if (message.thinking) {
    return (
      <div className={styles.thinkingBubble}>
        <span className={styles.thinkingDot} style={{ color: accent }}>
          ●
        </span>
        <span style={{ color: accent }}>{message.text}</span>
      </div>
    );
  }

  if (message.toolUse) {
    return (
      <div className={styles.toolBubble}>
        <span className={styles.toolIcon}>⚙</span>
        <span>
          {message.toolUse.name}
          {message.toolUse.status === "running" && (
            <span className={styles.thinkingDot}> ...</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.messageBubble} ${
        isUser ? styles.userMsg : styles.assistantMsg
      }`}
    >
      {isUser && <div className={styles.roleLabel}>You</div>}
      {!isUser && <div className={styles.roleLabel}>Assistant</div>}
      <div
        className={styles.messageText}
        style={
          isUser
            ? undefined
            : { borderLeft: `2px solid ${accent}33`, paddingLeft: 12 }
        }
      >
        {isUser ? (
          message.text
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.text}
          </ReactMarkdown>
        )}
        {message.streaming && (
          <span className={styles.cursor} style={{ backgroundColor: accent }} />
        )}
      </div>
    </div>
  );
}

// ─── Compaction Divider ───

function CompactionDivider({ message }: { message: ChatMessage }) {
  const c = message.compaction;
  if (!c) return null;

  return (
    <div className={styles.compactionDivider}>
      <div className={styles.compactionLine} />
      <span className={styles.compactionLabel}>
        context compacted &middot; {c.droppedMessages} msgs dropped &middot;{" "}
        {c.beforeTokens.toLocaleString()} &rarr; {c.afterTokens.toLocaleString()} tokens
      </span>
      <div className={styles.compactionLine} />
    </div>
  );
}

// ─── Failover Badge ───

function FailoverBadge({ session }: { session: AgentSession }) {
  const failover = session.usage?.failover;
  if (!failover) return null;

  return (
    <span className={styles.failoverBadge} title={failover.reason}>
      failover: {failover.from} &rarr; {failover.to}
    </span>
  );
}

// ─── Context Window Helper ───

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "gpt-4": 128000,
  "gpt-4o": 128000,
  "gpt-4-turbo": 128000,
  "claude-3-5-sonnet": 200000,
  "claude-3-opus": 200000,
  "claude-sonnet-4": 200000,
  "gemini-2.0-flash": 1000000,
  "gemini-2.5-flash": 1000000,
  "gemini-2.5-pro": 2000000,
};

function getContextWindow(model?: string): number {
  if (!model) return 200000; // default
  
  // Match partial model names
  for (const [key, size] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (model.toLowerCase().includes(key.toLowerCase())) {
      return size;
    }
  }
  
  return 200000; // default fallback
}

// ─── Main Column ───

export function AgentColumn({ agentId, columnIndex }: { agentId: string; columnIndex: number }) {
  const session = useAgentSession(agentId);
  const config = useAgentConfig(agentId);
  const send = useSendMessage(agentId);
  const deleteAgentOnGateway = useDeckStore((s) => s.deleteAgentOnGateway);
  const [input, setInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scrollRef = useAutoScroll(session?.messages);

  if (!config || !session) return null;

  // Calculate context usage
  const contextWindow = getContextWindow(session.usage?.model || config.model);
  const totalTokens = session.usage?.totalTokens || session.tokenCount || 0;
  const contextPercent = contextWindow > 0 ? (totalTokens / contextWindow) * 100 : 0;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Tab") {
      const offset = e.shiftKey ? -1 : 1;
      const next = document.querySelector<HTMLTextAreaElement>(
        `[data-deck-input="${columnIndex + offset}"]`
      );
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  };

  const isActive =
    session.status === "streaming" ||
    session.status === "thinking" ||
    session.status === "tool_use";

  // Determine if agent has completed work ready to review
  const lastMessage = session.messages[session.messages.length - 1];
  const hasCompletedWork = 
    session.status === "idle" &&
    session.messages.length > 0 &&
    lastMessage?.role === "assistant" &&
    !lastMessage?.streaming;

  return (
    <div 
      className={styles.column} 
      data-status={session.status}
      data-has-completed-work={hasCompletedWork}
    >
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.agentIcon}
          style={{
            color: config.accent,
            backgroundColor: `${config.accent}15`,
            borderColor: `${config.accent}30`,
          }}
        >
          {columnIndex + 1}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerRow}>
            <span className={styles.agentName}>{config.name}</span>
            <StatusBadge status={session.status} accent={config.accent} />
          </div>
          <div className={styles.headerMeta}>
            {config.context ? <span>{config.context}</span> : null}
            {config.model && (
              <>
                {config.context ? <span className={styles.metaDot}>·</span> : null}
                <span style={{ color: config.accent, opacity: 0.5 }}>
                  {config.model}
                </span>
              </>
            )}
            {totalTokens > 0 && (
              <>
                <span className={styles.metaDot}>·</span>
                <span style={{ opacity: contextPercent > 80 ? 1 : 0.6, color: contextPercent > 90 ? '#ef4444' : contextPercent > 80 ? '#f59e0b' : 'inherit' }}>
                  {totalTokens.toLocaleString()} tokens ({contextPercent.toFixed(1)}%)
                </span>
              </>
            )}
            <FailoverBadge session={session} />
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} title="Settings">
            ⚙
          </button>
          <button
            className={`${styles.deleteBtn} ${confirmDelete ? styles.confirmDelete : ""}`}
            title={confirmDelete ? "Click again to confirm" : "Delete agent"}
            onClick={() => {
              if (confirmDelete) {
                deleteAgentOnGateway(agentId);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
          >
            {confirmDelete ? "✕" : "×"}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={styles.messages}>
        {session.messages.length === 0 && (
          <div className={styles.emptyState}>
            <div
              className={styles.emptyIcon}
              style={{ color: config.accent }}
            >
              {columnIndex + 1}
            </div>
            <p>Send a message to start a conversation with {config.name}</p>
          </div>
        )}
        {session.messages.map((msg) =>
          msg.role === "compaction" ? (
            <CompactionDivider key={msg.id} message={msg} />
          ) : (
            <MessageBubble key={msg.id} message={msg} accent={config.accent} />
          )
        )}
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${config.name}...`}
            className={styles.input}
            data-deck-input={columnIndex}
            autoComplete="off"
            autoCapitalize="off"
            rows={4}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim()}
            style={
              input.trim()
                ? { backgroundColor: config.accent, color: "#000" }
                : undefined
            }
          >
            ↑
          </button>
        </div>
        {isActive && (
          <div
            className={styles.streamingBar}
            style={{ backgroundColor: config.accent }}
          />
        )}
      </div>
    </div>
  );
}
