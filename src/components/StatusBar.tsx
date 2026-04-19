import { useDeckStats } from "../hooks";
import { useDeckStore } from "../lib/store";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const stats = useDeckStats();
  const serverUrl = useDeckStore((s) => s.config.serverUrl);

  return (
    <div className={styles.bar}>
      <span>
        {serverUrl}{" "}
        <span
          className={
            !stats.serverConnected
              ? styles.disconnected
              : stats.waitingForUser > 0
                ? styles.connectedReady
                : styles.connectedIdle
          }
        >
          {!stats.serverConnected
            ? "disconnected"
            : stats.waitingForUser > 0
              ? "connected · waiting"
              : "connected"}
        </span>
      </span>
      <span className={styles.sep}>·</span>
      <span>
        {stats.totalAgents} agents · {stats.active} active
        {stats.waitingForUser > 0 && <> · {stats.waitingForUser} waiting</>}
        {stats.errors > 0 && (
          <>
            {" "}
            ·{" "}
            <span className={styles.error}>
              {stats.errors} {stats.errors === 1 ? "error" : "errors"}
            </span>
          </>
        )}
      </span>
      <span className={styles.spacer} />
      <span>multiclaude v0.1.0</span>
    </div>
  );
}
