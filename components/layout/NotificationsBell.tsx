"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  listMyUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import { formatDateFr } from "@/lib/format";
import type { AppNotification } from "@/lib/types";

export function NotificationsBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const nextItems = await listMyUnreadNotifications(20);
      setItems(nextItems);
      setError(null);
    } catch {
      setError("Notifications indisponibles.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safeReload = () => {
      reload().catch(() => {
        if (!cancelled) setError("Notifications indisponibles.");
      });
    };

    safeReload();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") safeReload();
    }, 15_000);

    const onFocus = () => safeReload();
    const onVisible = () => {
      if (document.visibilityState === "visible") safeReload();
    };
    const onChanged = () => safeReload();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
    };
  }, [reload]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) await reload();
  }

  async function handleMarkOne(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      await markNotificationRead(id);
    } catch {
      await reload();
    }
  }

  async function handleMarkAll() {
    setItems([]);
    try {
      await markAllNotificationsRead();
    } catch {
      await reload();
    }
  }

  const unread = items.length;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" />
        }
      >
        <span className="relative inline-flex">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={() => handleMarkAll()}
              >
                Tout marquer lu
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {error && (
          <DropdownMenuItem disabled className="justify-center text-muted-foreground">
            {error}
          </DropdownMenuItem>
        )}
        {!error && items.length === 0 && (
          <DropdownMenuItem disabled className="justify-center py-6 text-muted-foreground">
            Aucune notification
          </DropdownMenuItem>
        )}
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex cursor-pointer flex-col items-start gap-0.5 whitespace-normal"
            onClick={() => void handleMarkOne(item.id)}
          >
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.body}</span>
            <span className="text-[10px] text-muted-foreground">
              {item.created_at ? formatDateFr(item.created_at) : ""}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
