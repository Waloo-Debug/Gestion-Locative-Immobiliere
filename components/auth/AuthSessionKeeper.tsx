"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Garde la session vivante côté navigateur : refresh auto des tokens
 * et resynchronisation quand l’onglet redevient visible.
 */
export function AuthSessionKeeper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Les cookies sont mis à jour par @supabase/ssr à chaque refresh.
    });

    const refreshIfNeeded = () => {
      if (document.visibilityState === "visible") {
        void supabase.auth.getUser();
      }
    };

    document.addEventListener("visibilitychange", refreshIfNeeded);
    window.addEventListener("focus", refreshIfNeeded);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", refreshIfNeeded);
      window.removeEventListener("focus", refreshIfNeeded);
    };
  }, []);

  return children;
}
