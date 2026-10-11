import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "./server";
import type { Database } from "./database.types";

export type StaffContext = { supabase: SupabaseClient<Database>; user: User; role: "admin" | "editor" };

export async function getStaffContext(): Promise<StaffContext | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role)) return null;
  return { supabase, user, role: profile.role as "admin" | "editor" };
}

export async function requireStaff() {
  const context = await getStaffContext();
  if (!context) return { context: null, response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  return { context, response: null };
}
