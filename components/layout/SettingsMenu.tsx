"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Mail, Moon, Settings, Sun } from "lucide-react";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveReminderChannel } from "@/lib/owners";
import type { ReminderChannel } from "@/lib/types";

function normalizeChannel(value: string | null | undefined): ReminderChannel {
  if (value === "in_app" || value === "none" || value === "email") return value;
  return "email";
}

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { profile, reload } = useOwnerProfile();
  const [channel, setChannel] = useState<ReminderChannel>("email");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChannel(normalizeChannel(profile?.reminder_channel));
  }, [profile?.reminder_channel]);

  async function handleChannelChange(value: string) {
    const next = normalizeChannel(value);
    setChannel(next);
    setSaving(true);
    setError(null);
    try {
      await saveReminderChannel(next);
      await reload();
    } catch {
      setError("Enregistrement impossible.");
      setChannel(normalizeChannel(profile?.reminder_channel));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Paramètres" />}>
        <Settings />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Paramètres</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Rappels de paiement</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup value={channel} onValueChange={handleChannelChange}>
          <DropdownMenuRadioItem value="email" disabled={saving}>
            <Mail />
            E-mail
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="in_app" disabled={saving}>
            <BellRing />
            Notification dans l’app
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="none" disabled={saving}>
            <BellOff />
            Pas de rappel
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {error && <p className="px-1.5 py-1 text-xs text-destructive">{error}</p>}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Apparence</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (value === "light" || value === "dark") setTheme(value as ThemeMode);
          }}
        >
          <DropdownMenuRadioItem value="light">
            <Sun />
            Mode clair
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            Mode sombre
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
