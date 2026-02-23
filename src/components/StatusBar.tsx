import { useDeckStats } from "../hooks";
import { useDeckStore } from "../lib/store";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const stats = useDeckStats();
  const gatewayUrl = useDeckStore((s) => s.config.gatewayUrl);
  const pairingRequired = useDeckStore((s) => s.pairingRequired);

  const connectionLabel = pairingRequired
    ? "pairing required"
    : !stats.gatewayConnected
      ? "disconnected"
      : stats.waitingForUser > 0
        ? "connected · waiting"
        : "connected";

  const connectionClass = pairingRequired
    ? styles.pairing
    : !stats.gatewayConnected
      ? styles.disconnected
      : stats.waitingForUser > 0
        ? styles.connectedReady
        : styles.connectedIdle;

  return (
    <div className={styles.bar}>
      <span>
        {gatewayUrl}{" "}
        <span className={connectionClass}>
          {connectionLabel}
        </span>
      </span>
      <span className={styles.sep}>·</span>
      <span>
        {stats.totalAgents} agents · {stats.active} active
        {stats.waitingForUser > 0 && <> · {stats.waitingForUser} waiting</>}
        {stats.errors > 0 && <> · <span className={styles.error}>{stats.errors} {stats.errors === 1 ? "error" : "errors"}</span></>}
      </span>
      <span className={styles.spacer} />
      <span>openclaw-deck v2026.2.9</span>
    </div>
  );
}
