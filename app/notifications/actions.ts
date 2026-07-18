"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markRead(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
}

export async function dismissNotification(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ dismissed_at: new Date().toISOString(), read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
}

export async function markAllRead() {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .is("dismissed_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
}
