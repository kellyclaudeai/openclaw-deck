import { useState, useEffect } from "react";
import { useDeckStats } from "../hooks";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from "./TopBar.module.css";

const TABS = ["All Agents", "Active", "Queued", "Completed"] as const;

export function TopBar({
  activeTab,
  onTabChange,
  onAddAgent,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddAgent: () => void;
}) {
  const stats = useDeckStats();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.bar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>◈</div>
        <span className={styles.logoText}>OpenClaw</span>
        <span className={styles.logoBadge}>DECK</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
            {tab === "All Agents" && (
              <span className={styles.tabCount}>{stats.totalAgents}</span>
            )}
            {tab === "Active" && stats.active > 0 && (
              <span className={styles.tabCount}>{stats.active}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div
            className={styles.statDot}
            style={{
              backgroundColor: stats.gatewayConnected ? "#34d399" : "#ef4444",
            }}
          />
          <span>
            <span
              style={{
                color: stats.gatewayConnected ? "#34d399" : "#ef4444",
              }}
            >
              {stats.active}
            </span>{" "}
            streaming
          </span>
        </div>
        <div className={styles.stat}>
          tokens:{" "}
          <span className={styles.statValue}>
            {stats.totalTokens.toLocaleString()}
          </span>
        </div>
        <div className={styles.stat}>
          {time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })}
        </div>
      </div>

      <ThemeSwitcher />

      <button className={styles.addBtn} onClick={onAddAgent}>
        <span>+</span> New Agent
      </button>
    </div>
  );
}
