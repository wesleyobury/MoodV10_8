"use client";

import { EmbeddedContext } from "@/components/FilterBar";

/** Renders a pre-V3 admin page inside a tab of a new page. Its own filter bar hides; the host page's filters apply. */
export function Legacy({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <EmbeddedContext.Provider value={true}>
      {note && <p className="text-xs text-muted-foreground mb-4">{note}</p>}
      {children}
    </EmbeddedContext.Provider>
  );
}
