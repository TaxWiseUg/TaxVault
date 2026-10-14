export type ThemeMode = "system" | "light" | "dark";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("taxwise_theme") as ThemeMode) || "light";
}

export function applyTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem("taxwise_theme", theme);
  const root = document.documentElement;
  root.classList.remove("dark", "light");

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
  } else {
    // Default: light mode
    root.classList.add("light");
  }
}
