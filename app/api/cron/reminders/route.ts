import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL, COMPANY_NAME, OWNER_EMAIL } from "@/lib/resend";
import { syncNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically; also allow a manual secret for testing.
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  await syncNotifications(supabase);

  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const cutoff = in3Days.toISOString().slice(0, 10);

  const { data: rentals, error } = await supabase
    .from("rentals")
    .select("*, trailers(vin, make, model), renters(name)")
    .eq("status", "active")
    .lte("next_due_date", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rentals || rentals.length === 0) {
    return NextResponse.json({ sent: false, message: "Nothing due" });
  }

  if (!OWNER_EMAIL) {
    return NextResponse.json(
      { sent: false, message: "OWNER_EMAIL not configured" },
      { status: 200 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lines = rentals
    .map((r: any) => {
      const due = new Date(r.next_due_date);
      const days = Math.round((due.getTime() - today.getTime()) / 86400000);
      const status = days < 0 ? `${Math.abs(days)}d OVERDUE` : days === 0 ? "DUE TODAY" : `due in ${days}d`;
      return `• ${r.trailers.vin} (${r.trailers.make} ${r.trailers.model}) — ${r.renters.name} — ${status} (${r.next_due_date})`;
    })
    .join("\n");

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    subject: `Trailer rent due: ${rentals.length} trailer(s) need attention`,
    text: `Good morning,\n\nThe following trailer rentals are due or overdue:\n\n${lines}\n\nOpen Trailer Tracker to generate and send invoices.\n\n— ${COMPANY_NAME}`,
  });

  return NextResponse.json({ sent: true, count: rentals.length });
}
