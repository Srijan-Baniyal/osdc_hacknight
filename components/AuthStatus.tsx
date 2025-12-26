"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthStatus() {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Link href="/sign-in">
        <Button size="sm" variant="outline">
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm">Sign Up</Button>
      </Link>
    </div>
  );
}
