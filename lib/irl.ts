import type { IrlData } from "./types";

export async function fetchIrl(): Promise<IrlData | null> {
  const response = await fetch("/api/irl");
  if (!response.ok) throw new Error("Erreur réseau");
  const data = await response.json();
  return { rate: data.rate, quarter: data.quarter };
}
