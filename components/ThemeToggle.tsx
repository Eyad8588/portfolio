"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme ?? "dark"), []);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  };
  return (
    <button className="icon-btn" onClick={flip} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle theme">
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}
