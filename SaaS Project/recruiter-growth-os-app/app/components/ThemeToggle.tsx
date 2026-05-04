"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const handleClick = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleClick}
      suppressHydrationWarning
      className="
        inline-flex h-7 w-7 items-center justify-center
        rounded-md text-text-secondary
        hover:text-text-primary hover:bg-surface-2
      "
    >
      <SunIcon size={14} className="hidden dark:block" />
      <MoonIcon size={14} className="block dark:hidden" />
    </button>
  );
}
