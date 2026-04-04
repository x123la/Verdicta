import { useEffect } from "react";
import { AppRouter } from "./router";
import { useSettings } from "@/hooks/use-verdicta-query";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export const App = () => {
  const { data: settings } = useSettings();
  useKeyboardShortcuts();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
      settings?.theme === "dark" || (settings?.theme === "system" && prefersDark) || !settings?.theme;
    document.documentElement.classList.toggle("dark", isDark);
  }, [settings?.theme]);

  return <AppRouter />;
};
