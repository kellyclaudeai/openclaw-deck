import { useDeckStore } from "../lib/store";
import { themes } from "../themes";
import styles from "./ThemeSwitcher.module.css";

export function ThemeSwitcher() {
  const currentTheme = useDeckStore((s) => s.theme);
  const setTheme = useDeckStore((s) => s.setTheme);

  return (
    <div className={styles.container}>
      <label htmlFor="theme-select" className={styles.label}>
        Theme
      </label>
      <select
        id="theme-select"
        className={styles.select}
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
      >
        {Object.values(themes).map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
