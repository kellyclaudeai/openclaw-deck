/**
 * MultiClaude WebSocket Client
 *
 * Connects to the MultiClaude backend server and manages
 * communication for multiple Claude Code agent sessions.
 */

import type { ServerFrame, ClientFrame } from "../types";

type FrameHandler = (frame: ServerFrame) => void;
type ConnectionHandler = (connected: boolean) => void;

interface MultiClaudeClientOptions {
  url: string;
  onFrame?: FrameHandler;
  onConnection?: ConnectionHandler;
  maxReconnectAttempts?: number;
  reconnectBaseDelay?: number;
}

export class MultiClaudeClient {
  private ws: WebSocket | null = null;
  private options: Required<MultiClaudeClientOptions>;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private _connected = false;

  constructor(opts: MultiClaudeClientOptions) {
    this.options = {
      url: opts.url,
      onFrame: opts.onFrame ?? (() => {}),
      onConnection: opts.onConnection ?? (() => {}),
      maxReconnectAttempts: opts.maxReconnectAttempts ?? Infinity,
      reconnectBaseDelay: opts.reconnectBaseDelay ?? 1000,
    };
  }

  get connected() {
    return this._connected;
  }

  connect(): void {
    this.intentionalClose = false;
    this.createSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close(1000, "client disconnect");
  }

  /** Send a message to an agent */
  sendMessage(agentId: string, text: string): void {
    this.send({ type: "send", agentId, text });
  }

  // ─── Private ───

  private createSocket() {
    try {
      this.ws = new WebSocket(this.options.url);
    } catch (err) {
      console.error("[MultiClaude] Failed to create WebSocket:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[MultiClaude] Connected to server");
      this._connected = true;
      this.reconnectAttempts = 0;
      this.options.onConnection(true);
    };

    this.ws.onmessage = (evt) => {
      try {
        const frame: ServerFrame = JSON.parse(evt.data as string);
        this.options.onFrame(frame);
      } catch (err) {
        console.warn("[MultiClaude] Failed to parse frame:", err);
      }
    };

    this.ws.onclose = () => {
      const wasConnected = this._connected;
      this._connected = false;
      if (wasConnected) {
        this.options.onConnection(false);
      }
      if (!this.intentionalClose) {
        console.log("[MultiClaude] Connection lost, reconnecting...");
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error("[MultiClaude] WebSocket error:", err);
    };
  }

  private send(frame: ClientFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error("[MultiClaude] Max reconnect attempts reached");
      return;
    }
    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      30_000
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.createSocket();
    }, delay);
  }
}
