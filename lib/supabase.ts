import { createClient } from "@/lib/supabase/client";

/** Shared browser client for client components and data libs. */
export const supabase = createClient();
