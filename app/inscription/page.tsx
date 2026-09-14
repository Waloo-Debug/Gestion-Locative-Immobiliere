"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement...</div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
