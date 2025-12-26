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
    <Button
      className="relative overflow-hidden bg-transparent hover:bg-transparent focus:ring-0"
      onClick={toggleTheme}
      variant="outline"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 text-black opacity-100 transition-all duration-500 ease-in-out dark:-rotate-90 dark:scale-0 dark:text-white dark:opacity-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 text-black opacity-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 dark:text-white dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
