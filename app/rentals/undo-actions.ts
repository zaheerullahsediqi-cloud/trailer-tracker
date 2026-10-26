"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function undoRentalCompletion(rentalId: string, saveNote = false) {
  if (
    typeof rentalId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      rentalId,
    )
  ) {
    throw new Error("Choose a valid rental.");
  }
  if (typeof saveNote !== "boolean")
    throw new Error("Choose whether to save a correction note.");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sign in first.");
  const { data: admin, error: roleError } = await supabase.rpc("tracker_admin");
  if (roleError || !admin)
    throw new Error("Only an administrator can undo completion.");
  const { data, error } = await supabase.rpc("undo_rental_completion", {
    p_rental_id: rentalId,
    p_save_note: saveNote,
  });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("The rental could not be restored.");
  revalidatePath("/", "layout");
  return { savedNote: saveNote };
}
