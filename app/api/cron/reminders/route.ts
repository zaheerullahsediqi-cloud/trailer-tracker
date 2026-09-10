import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getResend, FROM_EMAIL, COMPANY_NAME, OWNER_EMAIL } from '@/lib/resend';
import { syncNotifications } from '@/lib/notifications';
import { authorizedCron } from '@/lib/cron-auth';
import { daysUntil } from '@/lib/billing';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!authorizedCron(req.headers.get('authorization'), secret)) return new NextResponse('Unauthorized', {status:401});
  try {
    const current = await syncNotifications(createAdminClient());
    const due = current.filter(n => daysUntil(n.due_date) <= 3);
    if (!due.length) return NextResponse.json({sent:false,message:'Nothing due'});
    if (!OWNER_EMAIL) return NextResponse.json({sent:false,message:'OWNER_EMAIL not configured'});
    const { data, error } = await getResend().emails.send({
      from:FROM_EMAIL, to:OWNER_EMAIL,
      subject:'Trailer rent due: ' + due.length + ' rental(s) need attention',
      text:due.map(n => n.message).join('\n') + '\n— ' + COMPANY_NAME,
    });
    if (error || !data?.id) throw new Error(error?.message || 'Email provider did not confirm delivery');
    return NextResponse.json({sent:true,count:due.length});
  } catch(error) {
    console.error('Reminder processing failed', error);
    return NextResponse.json({sent:false,error:'Reminder processing failed'}, {status:500});
  }
}
