"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthStatus() {

    return (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
            <Link href="/sign-in">
                <Button variant="outline" size="sm">
                    Sign In
                </Button>
            </Link>
            <Link href="/sign-up">
                <Button size="sm">
                    Sign Up
                </Button>
            </Link>
        </div>
    );
}
