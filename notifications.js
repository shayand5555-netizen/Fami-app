(() => {
  const SENT_KEY = 'fami-local-reminders-sent';
  let callbacks = null;
  let checkTimer = null;

  const supported = () => 'Notification' in window && 'serviceWorker' in navigator;
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const readSent = () => { try { return JSON.parse(localStorage.getItem(SENT_KEY) || '{}'); } catch { return {}; } };
  const saveSent = value => localStorage.setItem(SENT_KEY, JSON.stringify(value));
  const readQuiet = () => {try{return JSON.parse(localStorage.getItem('fami-notification-quiet')||'{"enabled":false,"from":"21:00","until":"07:00"}')}catch{return{enabled:false,from:'21:00',until:'07:00'}}};
  const inQuietHours = () => {const quiet=readQuiet();if(!quiet.enabled)return false;const now=new Date(),current=now.getHours()*60+now.getMinutes(),parts=value=>String(value||'00:00').split(':').map(Number),[fromH,fromM]=parts(quiet.from),[untilH,untilM]=parts(quiet.until),from=fromH*60+fromM,until=untilH*60+untilM;return from<=until?current>=from&&current<until:current>=from||current<until};
  const base64ToBytes = value => {const padding='='.repeat((4-value.length%4)%4);const raw=atob((value+padding).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))};
  const eventStart = event => event.startsAt ? new Date(event.startsAt) : event.date ? new Date(`${event.date}T${event.time||'12:00'}:00`) : null;

  async function registration() {
    if (!supported()) throw new Error('Dieses Gerät unterstützt keine Web-Benachrichtigungen.');
    return navigator.serviceWorker.ready;
  }

  async function show(title, options = {}) {
    const worker = await registration();
    await worker.showNotification(title, {icon:'./icons/fami-icon.svg',badge:'./icons/fami-icon.svg',tag:options.tag||'fami-test',renotify:true,...options});
  }

  async function subscribePush() {
    const key = window.FAMI_PUSH_PUBLIC_KEY;
    if (!key) return {online:false,reason:'Der Online-Pushschlüssel wird noch eingerichtet.'};
    if (!window.FamiCloud?.isConnected()) return {online:false,reason:'Für Online-Erinnerungen zuerst Fami Online verbinden.'};
    const worker = await registration();
    let subscription = await worker.pushManager.getSubscription();
    if (!subscription) subscription = await worker.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(key)});
    await window.FamiCloud.registerPush(subscription);
    return {online:true};
  }

  function statusMarkup() {
    if (!supported()) return '<strong>Auf diesem Browser nicht verfügbar</strong><span>Bitte Fami über Safari oder Chrome auf dem Startbildschirm installieren.</span>';
    const permission = Notification.permission;
    if (permission === 'denied') return '<strong>Benachrichtigungen blockiert</strong><span>Bitte in den Handy-Einstellungen Benachrichtigungen für Fami erlauben.</span>';
    if (permission === 'granted') return `<strong>✓ Benachrichtigungen erlaubt</strong><span>${window.FAMI_PUSH_PUBLIC_KEY&&window.FamiCloud?.isConnected()?'Online-Push kann verbunden werden.':'Lokale Erinnerungen funktionieren, solange Fami aktiv ist. Online-Push folgt nach der Servereinrichtung.'}</span>`;
    return `<strong>Noch nicht aktiviert</strong><span>${installed()?'Fami ist installiert und bereit.':'Installiere Fami zuerst auf dem Home-Bildschirm, besonders auf dem iPhone.'}</span>`;
  }

  function renderStatus(extra = '') {const host=document.querySelector('#notificationStatus');if(host)host.innerHTML=statusMarkup()+(extra?`<small>${extra}</small>`:'')}
  function open() {const quiet=readQuiet(),from=document.querySelector('#quietFrom'),until=document.querySelector('#quietUntil'),enabled=document.querySelector('#quietEnabled');if(from)from.value=quiet.from;if(until)until.value=quiet.until;if(enabled)enabled.checked=quiet.enabled;document.querySelector('#notificationModal').classList.add('open');document.querySelector('#notificationModal').setAttribute('aria-hidden','false');renderStatus()}
  function close() {document.querySelector('#notificationModal').classList.remove('open');document.querySelector('#notificationModal').setAttribute('aria-hidden','true')}

  async function enable() {
    try {
      if (!supported()) throw new Error('Benachrichtigungen werden auf diesem Gerät nicht unterstützt.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt.');
      const result = await subscribePush();renderStatus(result.online?'Online-Push ist verbunden.':result.reason);callbacks.notify(result.online?'Benachrichtigungen und Online-Push sind aktiv':'Benachrichtigungen sind auf diesem Gerät aktiviert');checkDue();
    } catch (error) {renderStatus(error.message);callbacks.notify(error.message)}
  }

  async function test() {
    try {if (Notification.permission !== 'granted') await enable();if (Notification.permission !== 'granted') return;await show('Fami erinnert dich 🔔',{body:'Test erfolgreich – dieses Handy kann Fami-Benachrichtigungen anzeigen.',tag:'fami-test',data:{url:'./?view=calendar'}})} catch (error) {callbacks.notify(error.message)}
  }

  async function checkDue() {
    if (!supported() || Notification.permission !== 'granted') return;
    if(inQuietHours())return;
    const now=Date.now(),sent=readSent();let changed=false;
    for (const event of callbacks.getState().events||[]) {
      const minutes=Number(event.reminderMinutes);if(minutes<0||!Number.isFinite(minutes))continue;const start=eventStart(event);if(!start||Number.isNaN(start.getTime()))continue;
      const due=start.getTime()-minutes*60000,key=`${event.id}:${due}`;if(now>=due&&now<due+90000&&!sent[key]){await show(`Bald: ${event.title}`,{body:`${event.time||''}${event.place?` · ${event.place}`:''}`,tag:`fami-event-${event.id}`,data:{url:'./?view=calendar',eventId:event.id}});sent[key]=now;changed=true}
    }
    if(changed)saveSent(sent);
  }

  function init(options) {
    callbacks=options;document.querySelector('#notificationSettings')?.addEventListener('click',open);document.querySelectorAll('[data-notification-close]').forEach(button=>button.addEventListener('click',close));document.querySelector('#enableNotifications')?.addEventListener('click',enable);document.querySelector('#testNotification')?.addEventListener('click',test);['quietFrom','quietUntil','quietEnabled'].forEach(id=>document.querySelector(`#${id}`)?.addEventListener('change',()=>{localStorage.setItem('fami-notification-quiet',JSON.stringify({enabled:document.querySelector('#quietEnabled').checked,from:document.querySelector('#quietFrom').value,until:document.querySelector('#quietUntil').value}));callbacks.notify('Ruhezeit auf diesem Gerät gespeichert')}));clearInterval(checkTimer);checkTimer=setInterval(checkDue,30000);checkDue();
  }

  window.FamiNotifications={init,open,checkDue};
})();
