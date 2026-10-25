"use server";
import { createClient } from "@/lib/supabase/server";
import { fleetSeed } from "@/lib/fleet-seed";
import { revalidatePath } from "next/cache";
export async function importOriginalInventory() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Sign in first.");
  const { data: admin, error: roleError } = await supabase.rpc("tracker_admin");
  if (roleError || !admin)
    throw new Error("Only an administrator can import inventory.");
  const { data, error } = await supabase.rpc("import_fleet_inventory", {
    p_records: fleetSeed,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data as { inserted: number; skipped: number };
}
