"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useSyncExternalStore } from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    () => () => {
      // Intentional noop - no cleanup needed for mount state
    },
    () => true,
    () => false
  );

  if (!mounted) {
    return null;
  }
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="mailshift-ui-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
