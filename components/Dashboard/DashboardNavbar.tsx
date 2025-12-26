"use client";

import { SignOutButton } from "@clerk/nextjs";
import ThemeSwitcher from "@/components/themeSwitcher";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Navbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator className="mr-2 h-4" orientation="vertical" />
        <h1 className="font-semibold text-lg">Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <SignOutButton />
      </div>
    </header>
  );
}
