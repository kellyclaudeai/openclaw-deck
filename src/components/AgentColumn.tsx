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
import type { AgentStatus, ChatMessage } from "../types";
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

  const label = status === "tool_use" ? "tool use" : status;

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
  const isSystem = message.role === "system";

  if (message.toolUse) {
    return (
      <div className={styles.toolBubble}>
        <span className={styles.toolIcon}>&#9881;</span>
        <span>
          {message.toolUse.name}
          {message.toolUse.status === "running" && (
            <span className={styles.thinkingDot}> ...</span>
          )}
        </span>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className={styles.toolBubble}>
        <span style={{ opacity: 0.7 }}>{message.text}</span>
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
      {!isUser && <div className={styles.roleLabel}>Claude</div>}
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
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {message.text || (message.streaming ? "" : "(no response)")}
          </ReactMarkdown>
        )}
        {message.streaming && (
          <span className={styles.cursor} style={{ backgroundColor: accent }} />
        )}
      </div>
    </div>
  );
}

// ─── Main Column ───

export function AgentColumn({
  agentId,
  columnIndex,
}: {
  agentId: string;
  columnIndex: number;
}) {
  const session = useAgentSession(agentId);
  const config = useAgentConfig(agentId);
  const send = useSendMessage(agentId);
  const removeAgent = useDeckStore((s) => s.removeAgent);
  const [input, setInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scrollRef = useAutoScroll(session?.messages);

  if (!config || !session) return null;

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
            {config.model && (
              <span style={{ color: config.accent, opacity: 0.5 }}>
                {config.model}
              </span>
            )}
            {session.sessionId && (
              <>
                <span className={styles.metaDot}>·</span>
                <span style={{ opacity: 0.4, fontSize: "0.7em" }}>
                  {session.sessionId.slice(0, 8)}
                </span>
              </>
            )}
          </div>
          <div className={styles.headerUsage}>
            <span style={{ opacity: 0.6 }}>
              {session.messages.length} messages ·{" "}
              {session.tokenCount.toLocaleString()} chars
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.deleteBtn} ${confirmDelete ? styles.confirmDelete : ""}`}
            title={confirmDelete ? "Click again to confirm" : "Remove column"}
            onClick={() => {
              if (confirmDelete) {
                removeAgent(agentId);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
          >
            {confirmDelete ? "\u2715" : "\u00d7"}
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
            <p>Send a message to start a Claude Code session</p>
          </div>
        )}
        {session.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} accent={config.accent} />
        ))}
        {isActive && session.messages.every((m) => !m.streaming) && (
          <div className={styles.thinkingBubble}>
            <span className={styles.thinkingDot} style={{ color: config.accent }}>
              ●
            </span>
            <span style={{ color: config.accent }}>
              {session.status === "thinking"
                ? "thinking..."
                : session.status === "tool_use"
                  ? "using tools..."
                  : "working..."}
            </span>
          </div>
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
            &#8593;
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
