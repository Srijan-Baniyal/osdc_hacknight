"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button onClick={toggleTheme} className="bg-transparent hover:bg-transparent focus:ring-0 relative overflow-hidden" variant="outline">
      <Sun className="h-[1.2rem] w-[1.2rem] text-black dark:text-white rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-90 dark:scale-0 dark:opacity-0 opacity-100" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] text-black dark:text-white rotate-90 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 dark:opacity-100 opacity-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}