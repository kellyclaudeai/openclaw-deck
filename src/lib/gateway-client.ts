/**
 * OpenClaw Gateway WebSocket Client
 *
 * Connects to the OpenClaw Gateway control plane and provides:
 * - Auto-reconnection with exponential backoff
 * - Request/response correlation via message IDs
 * - Event stream subscription
 * - Agent turn execution with streaming
 *
 * Protocol reference: https://docs.openclaw.ai/concepts/architecture
 *
 * Frame format:
 *   Request:  { type: "req",   id, method, params }
 *   Response: { type: "res",   id, ok, payload | error }
 *   Event:    { type: "event", event, payload, seq?, stateVersion? }
 */

import type {
  GatewayFrame,
  GatewayResponse,
  GatewayEvent,
} from "../types";

type EventHandler = (event: GatewayEvent) => void;
type ConnectionHandler = (connected: boolean) => void;

interface PendingRequest {
  resolve: (res: GatewayResponse) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface GatewayClientOptions {
  url: string;
  token?: string;
  /** Called on every event frame */
  onEvent?: EventHandler;
  /** Called when connection state changes */
  onConnection?: ConnectionHandler;
  /** Max reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Base reconnect delay in ms (default: 1000) */
  reconnectBaseDelay?: number;
  /** Request timeout in ms (default: 30000) */
  requestTimeout?: number;
}

interface DeviceIdentityRecord {
  id: string;
  publicKey: string; // base64url(raw 32-byte ed25519 public key)
  privateKeyJwk: JsonWebKey;
}

const OPERATOR_SCOPES = ["operator.read", "operator.write"];
const DEVICE_IDENTITY_STORAGE_KEY = "openclaw.deck.deviceIdentity.v1";

export class GatewayClient {
  private ws: WebSocket | null = null;
  private options: Required<GatewayClientOptions>;
  private pending = new Map<string, PendingRequest>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private _connected = false;
  private msgCounter = 0;

  constructor(opts: GatewayClientOptions) {
    this.options = {
      url: opts.url,
      token: opts.token ?? "",
      onEvent: opts.onEvent ?? (() => {}),
      onConnection: opts.onConnection ?? (() => {}),
      maxReconnectAttempts: opts.maxReconnectAttempts ?? Infinity,
      reconnectBaseDelay: opts.reconnectBaseDelay ?? 1000,
      requestTimeout: opts.requestTimeout ?? 30_000,
    };
  }

  get connected() {
    return this._connected;
  }

  /** Open the WebSocket connection and perform the handshake */
  connect(): void {
    this.intentionalClose = false;
    this.createSocket();
  }

  /** Gracefully close the connection */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close(1000, "client disconnect");
  }

  /**
   * Send a request and await the correlated response.
   * Rejects if the gateway returns ok:false or on timeout.
   */
  async request(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Gateway not connected");
    }

    const id = this.nextId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, this.options.requestTimeout);

      this.pending.set(id, {
        resolve: (res) => {
          clearTimeout(timeout);
          this.pending.delete(id);
          if (res.ok) {
            resolve(res.payload);
          } else {
            reject(
              new Error(res.error?.message ?? `Request ${method} failed`)
            );
          }
        },
        reject: (err) => {
          clearTimeout(timeout);
          this.pending.delete(id);
          reject(err);
        },
        timeout,
      });

      this.send({ type: "req", id, method, params: params ?? {} });
    });
  }

  /**
   * Run an agent turn. Sends `req:agent` and returns the initial ack.
   * Streaming content arrives as `event:agent` frames via onEvent.
   */
  async runAgent(
    agentId: string,
    message: string,
    sessionKey?: string
  ): Promise<{ runId: string; status: string }> {
    const idempotencyKey = `agent-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const result = await this.request("agent", {
      agentId,
      message,
      sessionKey,
      idempotencyKey,
    });

    return result as { runId: string; status: string };
  }

  /**
   * Send a message to a channel via the gateway.
   */
  async sendMessage(
    channel: string,
    peerId: string,
    text: string
  ): Promise<unknown> {
    const idempotencyKey = `send-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    return this.request("send", {
      channel,
      peerId,
      text,
      idempotencyKey,
    });
  }

  /** Get current gateway health */
  async health(): Promise<unknown> {
    return this.request("health");
  }

  /** Create an agent on the gateway */
  async createAgent(params: {
    id: string;
    name: string;
    model?: string;
    context?: string;
    shell?: string;
  }): Promise<unknown> {
    return this.request("agents.create", params);
  }

  /** Update an existing agent on the gateway */
  async updateAgent(params: {
    id: string;
    name?: string;
    model?: string;
    context?: string;
    shell?: string;
  }): Promise<unknown> {
    return this.request("agents.update", params);
  }

  /** Delete an agent from the gateway */
  async deleteAgent(agentId: string): Promise<unknown> {
    return this.request("agents.delete", { agentId });
  }

  // ─── Private ───

  private createSocket() {
    try {
      this.ws = new WebSocket(this.options.url);
    } catch (err) {
      console.error("[GatewayClient] Failed to create WebSocket:", err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = async () => {
      console.log("[GatewayClient] Socket opened, sending handshake...");
      try {
        let device: { id: string; publicKey: string; signature: string; signedAt: number } | undefined;
        try {
          device = await this.buildSignedDeviceIdentity();
        } catch (deviceErr) {
          console.warn("[GatewayClient] Device identity unavailable; falling back to token-only auth:", deviceErr);
        }

        const hello = (await this.request("connect", {
          client: {
            id: "openclaw-control-ui",
            version: "2026.2.16",
            platform: "web",
            mode: "webchat",
          },
          minProtocol: 3,
          maxProtocol: 3,
          role: "operator",
          scopes: OPERATOR_SCOPES,
          auth: this.getPreferredAuthToken()
            ? { token: this.getPreferredAuthToken() }
            : undefined,
          ...(device ? { device } : {}),
        })) as { auth?: { deviceToken?: string } };

        const issuedDeviceToken = hello?.auth?.deviceToken;
        if (issuedDeviceToken) {
          this.storeDeviceToken(issuedDeviceToken);
        }

        this._connected = true;
        this.reconnectAttempts = 0;
        this.options.onConnection(true);
        console.log("[GatewayClient] Connected to gateway");
      } catch (err) {
        console.error("[GatewayClient] Handshake failed:", err);
        this.ws?.close(4001, "handshake failed");
      }
    };

    this.ws.onmessage = (evt) => {
      try {
        const frame: GatewayFrame = JSON.parse(evt.data as string);
        this.handleFrame(frame);
      } catch (err) {
        console.warn("[GatewayClient] Failed to parse frame:", err);
      }
    };

    this.ws.onclose = (evt) => {
      const wasConnected = this._connected;
      this._connected = false;

      if (wasConnected) {
        this.options.onConnection(false);
      }

      // Reject all pending requests
      for (const [, pending] of this.pending) {
        pending.reject(new Error("Connection closed"));
      }
      this.pending.clear();

      if (!this.intentionalClose) {
        console.log(
          `[GatewayClient] Connection closed (code=${evt.code}), will reconnect...`
        );
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error("[GatewayClient] WebSocket error:", err);
    };
  }

  private handleFrame(frame: GatewayFrame) {
    switch (frame.type) {
      case "res": {
        const pending = this.pending.get(frame.id);
        if (pending) {
          pending.resolve(frame);
        }
        break;
      }
      case "event": {
        this.options.onEvent(frame);
        break;
      }
      default:
        break;
    }
  }

  private send(frame: GatewayFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  private nextId(): string {
    return `deck-${++this.msgCounter}-${Date.now()}`;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error("[GatewayClient] Max reconnect attempts reached");
      return;
    }

    const delay = Math.min(
      this.options.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      30_000
    );

    console.log(
      `[GatewayClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.createSocket();
    }, delay);
  }

  private getDeviceTokenStorageKey(): string {
    return `openclaw.deck.deviceToken.v1:${this.options.url}`;
  }

  private getStoredDeviceToken(): string {
    try {
      return localStorage.getItem(this.getDeviceTokenStorageKey()) ?? "";
    } catch {
      return "";
    }
  }

  private storeDeviceToken(token: string): void {
    try {
      localStorage.setItem(this.getDeviceTokenStorageKey(), token);
    } catch {
      // ignore persistence failures
    }
  }

  private getPreferredAuthToken(): string {
    return this.getStoredDeviceToken() || this.options.token || "";
  }

  private async buildSignedDeviceIdentity(): Promise<{
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
  }> {
    const identity = await this.loadOrCreateDeviceIdentity();
    const signedAt = Date.now();

    const payload = this.buildDeviceAuthPayload({
      version: "v1",
      deviceId: identity.id,
      clientId: "openclaw-control-ui",
      clientMode: "webchat",
      role: "operator",
      scopes: OPERATOR_SCOPES,
      signedAtMs: signedAt,
      token: this.getPreferredAuthToken() || null,
    });

    const key = await crypto.subtle.importKey(
      "jwk",
      identity.privateKeyJwk,
      { name: "Ed25519" } as AlgorithmIdentifier,
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      { name: "Ed25519" } as AlgorithmIdentifier,
      key,
      new TextEncoder().encode(payload)
    );

    return {
      id: identity.id,
      publicKey: identity.publicKey,
      signature: this.base64UrlEncode(new Uint8Array(signature)),
      signedAt,
    };
  }

  private async loadOrCreateDeviceIdentity(): Promise<DeviceIdentityRecord> {
    try {
      const raw = localStorage.getItem(DEVICE_IDENTITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeviceIdentityRecord;
        if (parsed?.id && parsed?.publicKey && parsed?.privateKeyJwk) {
          return parsed;
        }
      }
    } catch {
      // ignore parse failures and recreate
    }

    const keyPair = (await crypto.subtle.generateKey(
      { name: "Ed25519" } as AlgorithmIdentifier,
      true,
      ["sign", "verify"]
    )) as CryptoKeyPair;

    const publicRaw = new Uint8Array(
      await crypto.subtle.exportKey("raw", keyPair.publicKey)
    );
    const privateKeyJwk = (await crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    )) as JsonWebKey;

    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", publicRaw)
    );
    const id = Array.from(digest)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const record: DeviceIdentityRecord = {
      id,
      publicKey: this.base64UrlEncode(publicRaw),
      privateKeyJwk,
    };

    try {
      localStorage.setItem(DEVICE_IDENTITY_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // ignore persistence failures
    }

    return record;
  }

  private buildDeviceAuthPayload(params: {
    version?: "v1" | "v2";
    deviceId: string;
    clientId: string;
    clientMode: string;
    role: string;
    scopes: string[];
    signedAtMs: number;
    token?: string | null;
    nonce?: string;
  }): string {
    const version = params.version ?? (params.nonce ? "v2" : "v1");
    const scopes = params.scopes.join(",");
    const token = params.token ?? "";
    const base = [
      version,
      params.deviceId,
      params.clientId,
      params.clientMode,
      params.role,
      scopes,
      String(params.signedAtMs),
      token,
    ];
    if (version === "v2") {
      base.push(params.nonce ?? "");
    }
    return base.join("|");
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
}
