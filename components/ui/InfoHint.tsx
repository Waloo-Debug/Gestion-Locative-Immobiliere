"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "cn";

export function InfoHint({
  term,
  definition,
  className,
}: {
  term: string;
  definition: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={`Définition de ${term}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold leading-none text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        ?
      </button>
      {open ? (
        <span
          id={panelId}
          role="dialog"
          aria-label={term}
          className="absolute top-full left-0 z-50 mt-1.5 w-64 rounded-lg border border-border bg-popover px-3 py-2 text-xs leading-relaxed font-normal text-popover-foreground shadow-md"
        >
          <span className="mb-1 block font-medium text-foreground">{term}</span>
          {definition}
        </span>
      ) : null}
    </span>
  );
}
