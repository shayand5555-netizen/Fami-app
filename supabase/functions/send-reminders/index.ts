import {createClient} from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const jsonHeaders = {'content-type':'application/json; charset=utf-8'};
const env = (name:string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Server-Konfiguration fehlt: ${name}`);
  return value;
};

type FamilyState = {family_id:string;payload:{events?:CalendarEvent[]}};
type CalendarEvent = {id:string;title:string;startsAt?:string;date?:string;time?:string;place?:string;reminderMinutes?:number};
type Subscription = {id:string;family_id:string;endpoint:string;p256dh:string;auth:string};

function startOf(event:CalendarEvent) {
  if (event.startsAt) return new Date(event.startsAt);
  if (event.date) return new Date(`${event.date}T${event.time || '12:00'}:00`);
  return null;
}

Deno.serve(async request => {
  try {
    if (request.method !== 'POST') return new Response('Method not allowed', {status:405});
    if (request.headers.get('x-cron-secret') !== env('CRON_SECRET')) return new Response('Unauthorized', {status:401});

    webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {auth:{persistSession:false}});
    const [{data:states,error:stateError},{data:subscriptions,error:subscriptionError}] = await Promise.all([
      supabase.from('family_state').select('family_id,payload'),
      supabase.from('push_subscriptions').select('id,family_id,endpoint,p256dh,auth').eq('enabled',true)
    ]);
    if (stateError) throw stateError;
    if (subscriptionError) throw subscriptionError;

    const now = Date.now();
    const dueWindowStart = now - 60_000;
    const dueWindowEnd = now + 90_000;
    let sent = 0, skipped = 0, failed = 0;

    for (const state of (states || []) as FamilyState[]) {
      const familySubscriptions = ((subscriptions || []) as Subscription[]).filter(item => item.family_id === state.family_id);
      if (!familySubscriptions.length) continue;
      for (const event of state.payload?.events || []) {
        const minutes = Number(event.reminderMinutes);
        const start = startOf(event);
        if (!start || !Number.isFinite(minutes) || minutes < 0 || Number.isNaN(start.getTime())) continue;
        const reminderAt = start.getTime() - minutes * 60_000;
        if (reminderAt < dueWindowStart || reminderAt > dueWindowEnd) continue;

        for (const subscription of familySubscriptions) {
          const {data:delivery,error:deliveryError} = await supabase.from('push_deliveries').insert({
            subscription_id:subscription.id,event_id:event.id,reminder_at:new Date(reminderAt).toISOString()
          }).select('id').single();
          if (deliveryError?.code === '23505') { skipped++; continue; }
          if (deliveryError) throw deliveryError;

          try {
            await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}}, JSON.stringify({
              title:`Bald: ${event.title}`,
              body:`${event.time || ''}${event.place ? ` · ${event.place}` : ''}`,
              tag:`fami-event-${event.id}`,
              eventId:event.id,
              url:'./?view=calendar'
            }));
            await supabase.from('push_deliveries').update({status:'sent',delivered_at:new Date().toISOString()}).eq('id',delivery.id);
            sent++;
          } catch (error) {
            const statusCode = Number((error as {statusCode?:number}).statusCode || 0);
            if (statusCode === 404 || statusCode === 410) await supabase.from('push_subscriptions').update({enabled:false}).eq('id',subscription.id);
            await supabase.from('push_deliveries').update({status:'failed',error:String(error).slice(0,1000)}).eq('id',delivery.id);
            failed++;
          }
        }
      }
    }
    return new Response(JSON.stringify({ok:true,sent,skipped,failed}), {headers:jsonHeaders});
  } catch (error) {
    return new Response(JSON.stringify({ok:false,error:String(error)}), {status:500,headers:jsonHeaders});
  }
});
