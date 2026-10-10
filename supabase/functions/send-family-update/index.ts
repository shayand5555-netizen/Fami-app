import {createClient} from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'access-control-allow-origin':'*',
  'access-control-allow-headers':'authorization, x-client-info, apikey, content-type',
  'content-type':'application/json; charset=utf-8'
};
const env = (name:string) => {
  const value=Deno.env.get(name);
  if(!value)throw new Error(`Server-Konfiguration fehlt: ${name}`);
  return value;
};
const json = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:corsHeaders});
const clean = (value:unknown,max=180) => String(value||'').replace(/[\r\n]+/g,' ').trim().slice(0,max);

type Subscription={id:string;endpoint:string;p256dh:string;auth:string;user_id:string};

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const authorization=request.headers.get('authorization')||'';
    const token=authorization.replace(/^Bearer\s+/i,'');
    if(!token)return json({error:'Anmeldung erforderlich'},401);

    const supabase=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
    const {data:userData,error:userError}=await supabase.auth.getUser(token);
    const user=userData?.user;
    if(userError||!user)return json({error:'Ungültige Anmeldung'},401);

    const body=await request.json().catch(()=>({}));
    const familyId=clean(body.familyId,60),kind=clean(body.kind,30),title=clean(body.title,120),detail=clean(body.detail,180),entryId=clean(body.id,120),actor=clean(body.actor,60)||'Ein Familienmitglied';
    if(!familyId||!title||!['event','task','meal','shopping'].includes(kind))return json({error:'Ungültiger Eintrag'},400);

    const {data:membership}=await supabase.from('family_members').select('family_id').eq('family_id',familyId).eq('user_id',user.id).maybeSingle();
    if(!membership)return json({error:'Kein Zugriff auf diese Familie'},403);

    const {data:subscriptions,error:subscriptionError}=await supabase.from('push_subscriptions').select('id,endpoint,p256dh,auth,user_id').eq('family_id',familyId).eq('enabled',true).neq('user_id',user.id);
    if(subscriptionError)throw subscriptionError;

    webpush.setVapidDetails(env('VAPID_SUBJECT'),env('VAPID_PUBLIC_KEY'),env('VAPID_PRIVATE_KEY'));
    const labels:Record<string,string>={event:'Neuer Termin',task:'Neue Aufgabe',meal:'Neues Essen im Wochenplan',shopping:'Neuer Einkaufslisteneintrag'};
    const urls:Record<string,string>={event:'./?view=calendar',task:'./?view=tasks',meal:'./',shopping:'./?view=shopping'};
    let sent=0,failed=0;
    for(const subscription of (subscriptions||[]) as Subscription[]){
      try{
        await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({
          title:`${actor} · ${labels[kind]}`,
          body:`${actor} hat „${title}“ hinzugefügt${detail?` · ${detail}`:'.'}`,
          tag:`fami-new-${kind}-${entryId||crypto.randomUUID()}`,
          url:urls[kind],
          eventId:kind==='event'?entryId:null
        }));
        sent++;
      }catch(error){
        failed++;
        const statusCode=Number((error as {statusCode?:number}).statusCode||0);
        if(statusCode===404||statusCode===410)await supabase.from('push_subscriptions').update({enabled:false}).eq('id',subscription.id);
      }
    }
    return json({ok:true,sent,failed});
  }catch(error){
    console.error(error);
    return json({error:'Die Familienbenachrichtigung konnte nicht gesendet werden.'},500);
  }
});
