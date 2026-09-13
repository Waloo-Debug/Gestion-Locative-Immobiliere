"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  emptyOwnerProfileForm,
  fetchOwnerProfileState,
  ownerProfileToForm,
  upsertOwnerProfile,
} from "@/lib/owners";
import type { OwnerProfile, OwnerProfileFormValues } from "@/lib/types";

type OwnerProfileContextValue = {
  profile: OwnerProfile | null;
  form: OwnerProfileFormValues;
  setField: <K extends keyof OwnerProfileFormValues>(key: K, value: OwnerProfileFormValues[K]) => void;
  loading: boolean;
  saving: boolean;
  message: string | null;
  missingTable: boolean;
  reload: () => Promise<void>;
  save: (event?: React.FormEvent) => Promise<void>;
};

const OwnerProfileContext = createContext<OwnerProfileContextValue | null>(null);

export function OwnerProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [form, setForm] = useState<OwnerProfileFormValues>(emptyOwnerProfileForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [missingTable, setMissingTable] = useState(false);

  const reload = useCallback(async () => {
    const state = await fetchOwnerProfileState();
    setProfile(state.profile);
    setForm(ownerProfileToForm(state.profile));
    setMissingTable(state.missingTable);
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  function setField<K extends keyof OwnerProfileFormValues>(key: K, value: OwnerProfileFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await upsertOwnerProfile(form, {
      quittanceGenerationDay: profile?.quittance_generation_day ?? null,
    });
    setSaving(false);
    setMissingTable(result.missingTable);
    if (result.error && !result.missingTable) {
      setMessage(`Enregistrement impossible : ${result.error.message || "erreur inconnue"}`);
      return;
    }
    if (result.missingTable) {
      setMessage(
        "Profil enregistré localement. Pour le synchroniser, exécute le SQL supabase/owner_profiles.sql dans Supabase.",
      );
    } else {
      setMessage("Profil propriétaire enregistré.");
    }
    setProfile(result.data);
    setForm(ownerProfileToForm(result.data));
  }

  const value = useMemo(
    () => ({
      profile,
      form,
      setField,
      loading,
      saving,
      message,
      missingTable,
      reload,
      save,
    }),
    [profile, form, loading, saving, message, missingTable, reload],
  );

  return <OwnerProfileContext.Provider value={value}>{children}</OwnerProfileContext.Provider>;
}

export function useOwnerProfile() {
  const context = useContext(OwnerProfileContext);
  if (!context) {
    throw new Error("useOwnerProfile must be used within OwnerProfileProvider");
  }
  return context;
}
