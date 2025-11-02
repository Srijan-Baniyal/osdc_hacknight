"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { SignOutButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <SignOutButton />
      </div>
    </header>
  );
}
