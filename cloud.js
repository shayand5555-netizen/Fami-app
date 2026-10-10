(() => {
  const CONFIG_KEY = 'fami-cloud-config';
  const FAMILY_KEY = 'fami-cloud-family';
  const LOGIN_EMAIL_KEY = 'fami-login-email';
  const PENDING_KEY = 'fami-cloud-pending';
  let client = null;
  let session = null;
  let familyInfo = null;
  let channel = null;
  let callbacks = null;
  let pushTimer = null;
  let pendingSnapshot = null;
  let lastSyncedAt = null;
  let applyingRemote = false;
  let initialized = false;
  const LOCAL_ONLY_STATE_KEYS = ['taskPeople','calendarPeople','holidaySettings','recipeFoodFilter','recipeIngredientFilter','videoFoodFilter','videoIngredientFilter','recipeRatings','recipeSort','videoSort','videoChannel','videoMeal','videoCuisine','calendarView'];
  const readPending = () => {try{const entry=JSON.parse(localStorage.getItem(PENDING_KEY)||'null');return entry?.payload||null}catch{return null}};
  const savePending = payload => {pendingSnapshot=JSON.parse(JSON.stringify(payload));localStorage.setItem(PENDING_KEY,JSON.stringify({familyId:familyInfo?.id||localStorage.getItem(FAMILY_KEY)||'',savedAt:new Date().toISOString(),payload:pendingSnapshot}))};
  const clearPending = () => {pendingSnapshot=null;localStorage.removeItem(PENDING_KEY)};

  const readConfig = () => {
    const bundled = window.FAMI_CLOUD_CONFIG;
    if (bundled?.url && bundled?.key) return bundled;
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null'); } catch { return null; }
  };
  const statusButton = () => document.querySelector('#cloudStatus');
  const setStatus = (label, mode = 'offline', detail = '') => {
    const button = statusButton();
    if (!button) return;
    button.dataset.mode = mode;
    button.querySelector('strong').textContent = label;
    button.querySelector('small').textContent = detail || (mode === 'online' ? 'Live synchronisiert' : mode === 'working' ? 'Änderungen werden übertragen …' : navigator.onLine ? 'Antippen zum Einrichten' : 'Offline · wird später synchronisiert');
    const familyLabel = document.querySelector('#familySyncLabel');
    if (familyLabel) {
      const memberCount = callbacks?.getState?.().familyMembers?.length || 1;
      familyLabel.textContent = mode === 'online' ? `${memberCount} Mitglieder · live synchronisiert` : `${memberCount} Mitglieder · Online-Modus optional`;
    }
  };
  const notify = message => callbacks?.notify?.(message);
  const shareOrCopy = async (title,text) => {
    if(navigator.share){try{await navigator.share({title,text});return 'shared'}catch(error){if(error?.name==='AbortError')return 'cancelled'}}
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return 'copied'}
    const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();return 'copied';
  };
  const friendlyAuthError = error => {
    if(error?.status===429||/rate limit|too many|over_email_send_rate_limit/i.test(`${error?.code||''} ${error?.message||''}`))return 'Das Supabase-E-Mail-Limit ist erreicht (2 E-Mails pro Stunde). Bitte später erneut versuchen. Für mehr Anmeldungen muss in Supabase ein eigener SMTP-Maildienst eingerichtet werden.';
    if(/token.*(invalid|expired)|invalid.*token|otp.*(invalid|expired)|expired.*otp/i.test(`${error?.code||''} ${error?.message||''}`))return 'Der Code ist falsch oder abgelaufen. Bitte prüfe alle Ziffern aus der neuesten E-Mail oder fordere einen neuen Code an.';
    return error?.message || 'Anmeldung ist gerade nicht möglich.';
  };
  const displayFamilyName = () => callbacks?.getState?.().familyName || familyInfo?.name || 'Familie online';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

  function loadSdk() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('#supabaseSdk');
      if (existing) {
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', reject, {once:true});
        return;
      }
      const script = document.createElement('script');
      script.id = 'supabaseSdk';
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Supabase konnte nicht geladen werden'));
      document.head.append(script);
    });
  }

  async function connect() {
    const config = readConfig();
    if (!config?.url || !config?.key) { setStatus('Lokal gespeichert'); return; }
    setStatus('Online-Modus', 'working');
    try {
      await loadSdk();
      client = window.supabase.createClient(config.url, config.key, {
        auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}
      });
      const result = await client.auth.getSession();
      if (result.error) throw result.error;
      session = result.data.session;
      client.auth.onAuthStateChange((_event, nextSession) => {
        session = nextSession;
        if (session) {
          localStorage.removeItem(LOGIN_EMAIL_KEY);
          loadFamily();
        } else { familyInfo = null; setStatus('Anmeldung fehlt'); }
        renderSetup();
      });
      if (session) await loadFamily(); else setStatus('Anmeldung fehlt');
    } catch (error) {
      console.error(error);
      setStatus('Cloud nicht erreichbar');
      notify('Online-Verbindung fehlgeschlagen – lokale Nutzung bleibt möglich');
    }
  }

  async function loadFamily(options = {}) {
    if (!client || !session) return;
    const preferred = localStorage.getItem(FAMILY_KEY);
    let query = client.from('family_members').select('family_id,role,families(id,name,invite_code)');
    if (preferred) query = query.eq('family_id', preferred);
    const {data, error} = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) { familyInfo = null; setStatus('Familie verbinden'); renderSetup(); return; }
    familyInfo = {id:data.family_id, role:data.role, ...(data.families || {})};
    localStorage.setItem(FAMILY_KEY, familyInfo.id);
    await pullState(true, Boolean(options.replaceState));
    callbacks?.ensureDeviceProfile?.({id:session.user.id,email:session.user.email||''});
    if(pendingSnapshot)await pushNow(callbacks.getState());
    subscribe();
    setStatus(displayFamilyName(), 'online');
    renderSetup();
  }

  async function pullState(initial = false, replaceState = false) {
    if (!client || !familyInfo) return;
    const {data, error} = await client.from('family_state').select('payload,updated_by').eq('family_id', familyInfo.id).maybeSingle();
    if (error) throw error;
    const payload = data?.payload;
    if (!payload || !Object.keys(payload).length) {
      if (initial) await pushNow(callbacks.getState());
      return;
    }
    const containedSharedDeviceUser=Object.prototype.hasOwnProperty.call(payload,'currentUser');
    const containedSharedDevicePreferences=LOCAL_ONLY_STATE_KEYS.some(key=>Object.prototype.hasOwnProperty.call(payload,key));
    applyingRemote = true;
    callbacks.applyState(payload,{replace:replaceState});
    applyingRemote = false;
    if(containedSharedDeviceUser||containedSharedDevicePreferences)await pushNow(callbacks.getState());
  }

  function subscribe() {
    if (channel) client.removeChannel(channel);
    channel = client.channel(`fami-${familyInfo.id}`)
      .on('postgres_changes', {event:'*', schema:'public', table:'family_state', filter:`family_id=eq.${familyInfo.id}`}, payload => {
        if (payload.new?.updated_by === session?.user?.id) return;
        if (payload.new?.payload) {
          applyingRemote = true;
          callbacks.applyState(payload.new.payload);
          applyingRemote = false;
          notify('Änderung aus der Familie übernommen');
        }
      }).subscribe();
  }

  async function pushNow(payload) {
    savePending(payload);
    if (!client || !familyInfo || !session || applyingRemote || !navigator.onLine) {setStatus('Offline gespeichert','offline','Wird automatisch übertragen, sobald die Verbindung wieder da ist');return;}
    setStatus('Wird synchronisiert', 'working');
    const remote=await client.from('family_state').select('payload').eq('family_id',familyInfo.id).maybeSingle();
    if(!remote.error&&remote.data?.payload&&Object.keys(remote.data.payload).length){
      applyingRemote=true;
      callbacks.applyState(remote.data.payload);
      applyingRemote=false;
      payload=callbacks.getState();
      savePending(payload);
    }
    const {error} = await client.from('family_state').upsert({
      family_id:familyInfo.id,
      payload,
      updated_by:session.user.id,
      updated_at:new Date().toISOString()
    }, {onConflict:'family_id'});
    if (error) { console.error(error); setStatus('Noch nicht synchronisiert', 'offline', navigator.onLine?'Erneuter Versuch bei der nächsten Änderung':'Offline · wird nach der Verbindung übertragen'); return; }
    clearPending();lastSyncedAt = new Date();
    setStatus(displayFamilyName(), 'online', `Gerade synchronisiert · ${lastSyncedAt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`);
  }

  function schedulePush(payload) {
    if (applyingRemote) return;
    if(!familyInfo&&!localStorage.getItem(FAMILY_KEY))return;
    clearTimeout(pushTimer);
    const snapshot = JSON.parse(JSON.stringify(payload));
    savePending(snapshot);if(!client||!familyInfo||!session||!navigator.onLine){setStatus('Offline gespeichert','offline','Wird automatisch übertragen');return}setStatus('Änderungen gespeichert', 'working');
    pushTimer = setTimeout(() => pushNow(snapshot), 500);
  }

  async function createFamily(name) {
    const {data, error} = await client.rpc('create_family', {family_name:name});
    if (error) throw error;
    familyInfo = data?.[0];
    localStorage.setItem(FAMILY_KEY, familyInfo.id);
    const initialState = callbacks.getState();
    initialState.familyName = name;
    callbacks.applyState(initialState);
    await pushNow(initialState);
    await loadFamily();
    notify('Familie erstellt und dieses Gerät synchronisiert');
  }

  async function joinFamily(code) {
    const {data, error} = await client.rpc('join_family', {code});
    if (error) throw error;
    familyInfo = data?.[0];
    localStorage.setItem(FAMILY_KEY, familyInfo.id);
    await loadFamily({replaceState:true});
    notify('Familie verbunden');
  }

  async function sendLoginCode(email) {
    const lastSent=Number(localStorage.getItem('fami-login-mail-sent')||0),remaining=60000-(Date.now()-lastSent);if(remaining>0)throw new Error(`Bitte noch ${Math.ceil(remaining/1000)} Sekunden warten, bevor du einen neuen Code anforderst.`);
    const {error} = await client.auth.signInWithOtp({email, options:{shouldCreateUser:true}});
    if (error) throw error;
    localStorage.setItem(LOGIN_EMAIL_KEY,email);
    localStorage.setItem('fami-login-mail-sent',String(Date.now()));
    notify('Anmeldecode wurde per E-Mail gesendet');
  }

  async function verifyLoginCode(email, token) {
    const code=String(token||'').replace(/\D/g,'').slice(0,8);
    if(code.length<6||code.length>8)throw new Error('Bitte gib den vollständigen Code mit sechs bis acht Ziffern ein.');
    const {data,error}=await client.auth.verifyOtp({email,token:code,type:'email'});
    if(error)throw error;
    if(!data?.session)throw new Error('Die Anmeldung konnte nicht abgeschlossen werden. Bitte fordere einen neuen Code an.');
    session=data.session;
    localStorage.removeItem(LOGIN_EMAIL_KEY);
    await loadFamily();
    renderSetup();
    notify('Anmeldung erfolgreich');
  }

  async function registerPush(subscription) {
    if (!client || !session || !familyInfo) throw new Error('Fami Online ist noch nicht verbunden.');
    const json = subscription.toJSON();
    const {error} = await client.from('push_subscriptions').upsert({
      family_id:familyInfo.id,
      user_id:session.user.id,
      endpoint:json.endpoint,
      p256dh:json.keys?.p256dh,
      auth:json.keys?.auth,
      user_agent:navigator.userAgent.slice(0,500),
      enabled:true,
      updated_at:new Date().toISOString()
    }, {onConflict:'endpoint'});
    if (error) throw error;
  }

  async function notifyNewEntry(entry) {
    if (!client || !session || !familyInfo || !entry?.title) return;
    try {
      const {error}=await client.functions.invoke('send-family-update',{body:{...entry,familyId:familyInfo.id}});
      if(error)console.warn('Familien-Push konnte nicht gesendet werden',error);
    } catch(error) {
      console.warn('Familien-Push konnte nicht gesendet werden',error);
    }
  }

  async function uploadFiles(entity, files) {
    if (!client || !familyInfo || !session || !files?.length) return [];
    const uploaded = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const path = `${familyInfo.id}/${crypto.randomUUID()}-${safeName}`;
      const stored = await client.storage.from('family-files').upload(path, file, {contentType:file.type, upsert:false});
      if (stored.error) throw stored.error;
      const meta = await client.from('family_files').insert({family_id:familyInfo.id,entity,name:file.name,mime_type:file.type,size:file.size,storage_path:path,uploaded_by:session.user.id}).select().single();
      if (meta.error) { await client.storage.from('family-files').remove([path]); throw meta.error; }
      uploaded.push(meta.data);
    }
    return uploaded;
  }

  async function listFiles(entity = null) {
    if (!client || !familyInfo) return [];
    let query = client.from('family_files').select('*').eq('family_id', familyInfo.id).order('created_at', {ascending:false});
    if (entity) query = query.eq('entity', entity);
    const {data, error} = await query;
    if (error) throw error;
    const result = [];
    for (const item of data || []) {
      const download = await client.storage.from('family-files').download(item.storage_path);
      if (!download.error) result.push({id:`cloud:${item.id}`,entity:item.entity,name:item.name,type:item.mime_type,size:item.size,blob:download.data,cloud:true});
    }
    return result;
  }

  async function deleteFile(id) {
    if (!client || !familyInfo || !id?.startsWith('cloud:')) return false;
    const realId = id.slice(6);
    const {data, error} = await client.from('family_files').select('storage_path').eq('id', realId).single();
    if (error) throw error;
    await client.storage.from('family-files').remove([data.storage_path]);
    const removed = await client.from('family_files').delete().eq('id', realId);
    if (removed.error) throw removed.error;
    return true;
  }

  async function analyzeRecipePhoto(image) {
    if (!client || !session) throw new Error('Für die KI-Fotoanalyse ist eine Anmeldung bei Fami Online erforderlich.');
    const {data, error} = await client.functions.invoke('analyze-recipe', {body:{image}});
    if (error) {
      let message = '';
      try {
        const details = await error.context?.clone?.().json();
        message = details?.error || details?.message || '';
      } catch {}
      const rawMessage=message || error.message || '';
      const friendlyMessage=/high demand|overloaded|resource exhausted|try again later/i.test(rawMessage)
        ? 'Die KI ist gerade stark ausgelastet. Bitte versuche es in ein paar Minuten erneut.'
        : /credit|quota|billing|payment/i.test(rawMessage)
          ? 'Das kostenlose KI-Kontingent ist momentan aufgebraucht. Bitte versuche es später erneut.'
          : /network|fetch|timeout/i.test(rawMessage)
            ? 'Die KI ist gerade nicht erreichbar. Bitte prüfe deine Verbindung und versuche es erneut.'
            : rawMessage;
      throw new Error(friendlyMessage || 'Die KI-Fotoanalyse konnte nicht erreicht werden.');
    }
    if (!data?.recipe) throw new Error(data?.error || 'Die KI konnte auf diesem Foto kein Rezept erkennen.');
    return data.recipe;
  }

  async function analyzeRecipeUrl(url) {
    if (!client || !session) throw new Error('Für den KI-Linkimport ist eine Anmeldung bei Fami Online erforderlich.');
    const {data, error} = await client.functions.invoke('analyze-recipe', {body:{mode:'url',url}});
    if (error) {
      let message = '';
      try { const details = await error.context?.clone?.().json(); message = details?.error || details?.message || ''; } catch {}
      const rawMessage=message || error.message || '';
      if(/high demand|overloaded|resource exhausted|try again later/i.test(rawMessage))throw new Error('Die KI ist gerade stark ausgelastet. Bitte versuche es in ein paar Minuten erneut.');
      if(/credit|quota|billing|payment/i.test(rawMessage))throw new Error('Das kostenlose KI-Kontingent ist momentan aufgebraucht. Bitte versuche es später erneut.');
      throw new Error(rawMessage || 'Der Rezeptlink konnte nicht ausgewertet werden.');
    }
    if (!data?.recipe) throw new Error(data?.error || 'Auf dieser Seite wurde kein vollständiges Rezept gefunden.');
    return data.recipe;
  }

  async function analyzeVideoRecipe(video) {
    if (!client || !session) throw new Error('Für die KI-Rezeptergänzung ist eine Anmeldung bei Fami Online erforderlich.');
    const {data, error} = await client.functions.invoke('analyze-recipe', {body:{mode:'video',video}});
    if (error) {
      let message = '';
      try {
        const details = await error.context?.clone?.().json();
        message = details?.error || details?.message || '';
      } catch {}
      const rawMessage=message || error.message || '';
      if(/high demand|overloaded|resource exhausted|try again later/i.test(rawMessage))throw new Error('Die KI ist gerade stark ausgelastet. Bitte versuche es in ein paar Minuten erneut.');
      if(/credit|quota|billing|payment/i.test(rawMessage))throw new Error('Das kostenlose KI-Kontingent ist momentan aufgebraucht. Bitte versuche es später erneut.');
      throw new Error(rawMessage || 'Das KI-Rezept konnte nicht erstellt werden.');
    }
    if (!data?.recipe) throw new Error(data?.error || 'Die KI konnte zu diesem Video kein Rezept erstellen.');
    return data.recipe;
  }

  function openSetup() {
    renderSetup();
    const modal = document.querySelector('#cloudModal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeSetup() {
    const modal = document.querySelector('#cloudModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderSetup() {
    const host = document.querySelector('#cloudSetup');
    if (!host) return;
    const config = readConfig();
    if (!config) {
      host.innerHTML = `<p class="cloud-explain">Fami Online konnte nicht geladen werden. Bitte aktualisiere die App oder versuche es später erneut.</p>`;
      return;
    }
    if (!session) {
      const pendingEmail=localStorage.getItem(LOGIN_EMAIL_KEY)||'';
      if(pendingEmail){
        host.innerHTML = `<p class="cloud-explain">Wir haben einen Anmeldecode an <strong>${escapeHtml(pendingEmail)}</strong> gesendet. Bleibe in dieser App und gib alle Ziffern aus der E-Mail hier ein.</p><form id="cloudCodeForm"><label>Code aus der E-Mail<input id="cloudOtp" class="cloud-otp" type="text" required maxlength="8" minlength="6" pattern="[0-9]{6,8}" autocomplete="one-time-code" inputmode="numeric" enterkeyhint="done" placeholder="12345678" aria-describedby="cloudOtpHelp"></label><button class="btn primary">Code bestätigen</button></form><p class="cloud-help" id="cloudOtpHelp">Je nach Supabase-Einstellung hat der Code sechs oder acht Ziffern und ist eine Stunde gültig.</p><div class="cloud-login-alternatives"><button class="btn ghost" type="button" id="resendLoginCode">Neuen Code senden</button><button class="btn ghost" type="button" id="changeLoginEmail">Andere E-Mail-Adresse</button></div><p class="cloud-rate-note">Ein neuer Code kann frühestens nach 60 Sekunden gesendet werden. Bereits angemeldete Geräte bleiben angemeldet.</p>`;
        const otp=document.querySelector('#cloudOtp');
        otp.addEventListener('input',()=>{otp.value=otp.value.replace(/\D/g,'').slice(0,8)});
        document.querySelector('#cloudCodeForm').onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;button.textContent='Code wird geprüft …';try{await verifyLoginCode(pendingEmail,otp.value)}catch(error){notify(friendlyAuthError(error));button.disabled=false;button.textContent='Code bestätigen';otp.select()}};
        document.querySelector('#resendLoginCode').onclick=async()=>{const button=document.querySelector('#resendLoginCode');button.disabled=true;try{await sendLoginCode(pendingEmail)}catch(error){notify(friendlyAuthError(error))}finally{button.disabled=false}};
        document.querySelector('#changeLoginEmail').onclick=()=>{localStorage.removeItem(LOGIN_EMAIL_KEY);renderSetup()};
        setTimeout(()=>otp.focus(),0);
      }else{
        host.innerHTML = `<p class="cloud-explain">Melde dich ohne Passwort an. Fami sendet dir einen Anmeldecode per E-Mail – du musst keinen Link im Browser öffnen.</p><form id="cloudLoginForm"><label>E-Mail-Adresse<input id="cloudEmail" type="email" required autocomplete="email" inputmode="email" enterkeyhint="send"></label><button class="btn primary">Code senden</button></form><p class="cloud-help">Du wurdest eingeladen? Nach der Anmeldung kannst du direkt den Familiencode eingeben. Ein Familiencode aus einem Einladungslink bleibt gespeichert.</p><p class="cloud-rate-note">Hinweis: Der kostenlose Supabase-Maildienst erlaubt nur wenige E-Mails pro Stunde. Bereits angemeldete Geräte bleiben angemeldet und benötigen keinen neuen Code.</p>`;
        document.querySelector('#cloudLoginForm').onsubmit = async event => {event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;button.textContent='Code wird gesendet …';try{await sendLoginCode(document.querySelector('#cloudEmail').value.trim());renderSetup()}catch(error){notify(friendlyAuthError(error));button.disabled=false;button.textContent='Code senden'}};
      }
      return;
    }
    if (!familyInfo) {
      const inviteCode=(new URLSearchParams(location.search).get('invite')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
      host.innerHTML = `<p class="cloud-explain"><strong>Wie möchtest du Fami nutzen?</strong> Jede Familie ist eine getrennte, private Gruppe. Termine, Aufgaben, Rezepte und Dateien werden nie zwischen verschiedenen Gruppen vermischt.</p><div class="cloud-family-forms cloud-group-choices"><form id="joinFamilyForm"><span class="cloud-choice-number">1</span><strong>Ich gehöre zu dieser Familie</strong><small>Nur wählen, wenn dir ein Familienmitglied diesen privaten Code geschickt hat.</small><label>Einladungscode<input id="familyCode" required maxlength="8" autocomplete="one-time-code" autocapitalize="characters" value="${escapeHtml(inviteCode)}" placeholder="AB12CD34"></label><button class="btn primary">Bestehender Familie beitreten</button></form><form id="createFamilyForm"><span class="cloud-choice-number">2</span><strong>Ich möchte meine eigene Gruppe</strong><small>Für Freunde, Paare oder Familien, die ihre eigenen Daten getrennt verwalten möchten.</small><label>Name der neuen Familie<input id="familyName" required placeholder="z. B. Familie Weber"></label><button class="btn ghost">Eigene Familie erstellen</button></form></div><div class="cloud-mini-guide"><strong>Woran erkenne ich die richtige Wahl?</strong><ul><li><b>Privater Einladungslink:</b> Du siehst schon einen Code – dann trittst du genau dieser Familie bei.</li><li><b>Normaler Fami-Link:</b> Kein Code ist eingetragen – dann erstellst du deine eigene Gruppe.</li></ul><small>Ein Einladungscode gewährt Zugriff auf die gemeinsamen Familiendaten. Gib ihn nur an Personen weiter, die wirklich zu dieser Gruppe gehören.</small></div>`;
      document.querySelector('#createFamilyForm').onsubmit = async event => {event.preventDefault();try{await createFamily(document.querySelector('#familyName').value.trim());renderSetup()}catch(error){notify(error.message)}};
      document.querySelector('#joinFamilyForm').onsubmit = async event => {event.preventDefault();try{await joinFamily(document.querySelector('#familyCode').value.trim());history.replaceState({},'',location.pathname);renderSetup()}catch(error){notify(error.message)}};
      return;
    }
    host.innerHTML = `<div class="cloud-connected"><span>✓</span><div><strong>${escapeHtml(displayFamilyName())}</strong><p>Live-Synchronisierung ist aktiv · eure Daten bleiben in dieser Gruppe.</p></div></div><div class="share-paths"><section class="share-path private"><span>FÜR EURE GRUPPE</span><h3>Familienmitglied einladen</h3><p>Diese Person sieht anschließend eure gemeinsamen Termine, Aufgaben, Listen und Dateien.</p><div class="invite-code"><small>Privater Familiencode</small><strong>${escapeHtml(familyInfo.invite_code)}</strong><button class="btn ghost" id="copyInvite">Nur Code kopieren</button><button class="btn primary" id="shareInvitation">Einladung teilen</button></div><small>Auf dem iPhone öffnet sich direkt das Teilen-Menü. Der private Code ist bereits im Link enthalten.</small></section><section class="share-path separate"><span>FÜR FREUNDE</span><h3>Fami empfehlen · eigene Gruppe</h3><p>Dieser Link enthält keinen Familiencode. Freunde melden sich an und erstellen ihre eigene, vollständig getrennte Gruppe.</p><button class="btn ghost" id="shareAppRecommendation">Fami ohne Familiencode teilen</button></section></div><div class="cloud-mini-guide"><strong>Vor dem Senden kurz prüfen</strong><ol><li><b>Gehört die Person zu eurer Familie?</b> Dann „Einladung teilen“.</li><li><b>Soll sie Fami nur selbst testen?</b> Dann „Fami ohne Familiencode teilen“.</li><li>Auf dem neuen Handy Fami öffnen, mit der eigenen E-Mail anmelden und der angezeigten Auswahl folgen.</li></ol><small>Den privaten Familiencode nur an vertraute Personen weitergeben.</small></div><button class="text-btn cloud-reset" id="cloudLogout">Von der Cloud abmelden</button>`;
    document.querySelector('#copyInvite').onclick = async () => {await navigator.clipboard.writeText(familyInfo.invite_code);notify('Einladungscode kopiert')};
    document.querySelector('#shareInvitation').onclick = async () => {const sender=callbacks?.getDeviceUser?.()||'ein Familienmitglied';if(!confirm(`Private Einladung als ${sender} teilen?\n\nDie eingeladene Person erhält Zugriff auf Termine, Aufgaben, Listen, Rezepte und Dateien dieser Familie. Bitte nur an eine vertraute Person senden.`))return;const appUrl=`${location.origin}${location.pathname}?invite=${encodeURIComponent(familyInfo.invite_code)}`;const message=`${sender} lädt dich in die private Fami-Gruppe „${displayFamilyName()}“ ein: ${appUrl}\n\n1. Öffne den Link auf deinem Handy.\n2. Fordere mit deiner eigenen E-Mail-Adresse einen Anmeldecode an.\n3. Wechsle kurz zur Mail-App, merke oder kopiere alle Ziffern des Codes und gib ihn in Fami ein.\n4. Der Familiencode ${familyInfo.invite_code} ist bereits vorausgefüllt – tippe nur noch auf „Familie beitreten“.\n5. Wähle danach unter „Familie bearbeiten“ dein eigenes Profil aus.\n\nDieser Link öffnet gemeinsame Familiendaten. Bitte nicht weiterleiten.`;const result=await shareOrCopy('Private Fami-Einladung',message);if(result==='shared'||result==='copied'){localStorage.setItem('fami-last-family-invite-at',new Date().toISOString());notify(result==='copied'?'Einladung kopiert – du kannst sie jetzt versenden':'Private Einladung wurde geteilt')}};
    document.querySelector('#shareAppRecommendation').onclick = async () => {const appUrl=`${location.origin}${location.pathname}`;const message=`Teste Fami für deinen Familienalltag: ${appUrl}\n\nÖffne den normalen Link, melde dich mit deiner eigenen E-Mail-Adresse an und wähle anschließend „Eigene Familie erstellen“. Deine Gruppe bleibt vollständig von meiner Familie getrennt.`;const result=await shareOrCopy('Fami kennenlernen',message);if(result==='copied')notify('Fami-Link kopiert – du kannst ihn jetzt versenden')};
    document.querySelector('#cloudLogout').onclick = async () => {await client.auth.signOut();localStorage.removeItem(FAMILY_KEY);location.reload()};
  }

  async function init(options) {
    if (initialized) return;
    initialized = true;
    callbacks = options;
    pendingSnapshot=readPending();
    document.querySelector('#cloudStatus')?.addEventListener('click', openSetup);
    document.querySelectorAll('[data-cloud-close]').forEach(button => button.addEventListener('click', closeSetup));
    await connect();
    window.addEventListener('offline',()=>setStatus('Offline', 'offline', 'Änderungen bleiben sicher auf diesem Gerät'));
    window.addEventListener('online',()=>{if(pendingSnapshot)pushNow(pendingSnapshot);else if(familyInfo)setStatus(displayFamilyName(),'online','Verbindung wiederhergestellt')});
    setInterval(()=>{if(navigator.onLine&&pendingSnapshot&&client&&familyInfo&&session)pushNow(pendingSnapshot)},20000);
  }

  window.FamiCloud = {
    init,
    openSetup,
    schedulePush,
    uploadFiles,
    listFiles,
    deleteFile,
    analyzeRecipePhoto,
    analyzeRecipeUrl,
    analyzeVideoRecipe,
    registerPush,
    notifyNewEntry,
    getCurrentAccount:() => session?.user ? {id:session.user.id,email:session.user.email||''} : null,
    getSyncStatus:() => ({connected:Boolean(client&&familyInfo&&session),pending:Boolean(pendingSnapshot),lastSyncedAt:lastSyncedAt?.toISOString()||'',online:navigator.onLine}),
    isConnected:() => Boolean(client && familyInfo && session)
  };
})();
