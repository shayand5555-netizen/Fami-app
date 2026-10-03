(() => {
  const CONFIG_KEY = 'fami-cloud-config';
  const FAMILY_KEY = 'fami-cloud-family';
  let client = null;
  let session = null;
  let familyInfo = null;
  let channel = null;
  let callbacks = null;
  let pushTimer = null;
  let applyingRemote = false;
  let initialized = false;

  const readConfig = () => {
    const bundled = window.FAMI_CLOUD_CONFIG;
    if (bundled?.url && bundled?.key) return bundled;
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null'); } catch { return null; }
  };
  const statusButton = () => document.querySelector('#cloudStatus');
  const setStatus = (label, mode = 'offline') => {
    const button = statusButton();
    if (!button) return;
    button.dataset.mode = mode;
    button.querySelector('strong').textContent = label;
    button.querySelector('small').textContent = mode === 'online' ? 'Live synchronisiert' : mode === 'working' ? 'Wird verbunden …' : 'Antippen zum Einrichten';
    const familyLabel = document.querySelector('#familySyncLabel');
    if (familyLabel) {
      const memberCount = callbacks?.getState?.().familyMembers?.length || 1;
      familyLabel.textContent = mode === 'online' ? `${memberCount} Mitglieder · live synchronisiert` : `${memberCount} Mitglieder · Online-Modus optional`;
    }
  };
  const notify = message => callbacks?.notify?.(message);
  const friendlyAuthError = error => {
    if(error?.status===429||/rate limit|too many|over_email_send_rate_limit/i.test(`${error?.code||''} ${error?.message||''}`))return 'Das Supabase-E-Mail-Limit ist erreicht (2 E-Mails pro Stunde). Bitte später erneut versuchen. Für mehr Anmeldungen muss in Supabase ein eigener SMTP-Maildienst eingerichtet werden.';
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
        if (session) loadFamily(); else { familyInfo = null; setStatus('Anmeldung fehlt'); }
        renderSetup();
      });
      if (session) await loadFamily(); else setStatus('Anmeldung fehlt');
    } catch (error) {
      console.error(error);
      setStatus('Cloud nicht erreichbar');
      notify('Online-Verbindung fehlgeschlagen – lokale Nutzung bleibt möglich');
    }
  }

  async function loadFamily() {
    if (!client || !session) return;
    const preferred = localStorage.getItem(FAMILY_KEY);
    let query = client.from('family_members').select('family_id,role,families(id,name,invite_code)');
    if (preferred) query = query.eq('family_id', preferred);
    const {data, error} = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) { familyInfo = null; setStatus('Familie verbinden'); renderSetup(); return; }
    familyInfo = {id:data.family_id, role:data.role, ...(data.families || {})};
    localStorage.setItem(FAMILY_KEY, familyInfo.id);
    await pullState(true);
    subscribe();
    setStatus(displayFamilyName(), 'online');
    renderSetup();
  }

  async function pullState(initial = false) {
    if (!client || !familyInfo) return;
    const {data, error} = await client.from('family_state').select('payload,updated_by').eq('family_id', familyInfo.id).maybeSingle();
    if (error) throw error;
    const payload = data?.payload;
    if (!payload || !Object.keys(payload).length) {
      if (initial) await pushNow(callbacks.getState());
      return;
    }
    applyingRemote = true;
    callbacks.applyState(payload);
    applyingRemote = false;
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
    if (!client || !familyInfo || !session || applyingRemote) return;
    const {error} = await client.from('family_state').upsert({
      family_id:familyInfo.id,
      payload,
      updated_by:session.user.id,
      updated_at:new Date().toISOString()
    }, {onConflict:'family_id'});
    if (error) { console.error(error); setStatus('Synchronisierung gestört'); return; }
    setStatus(displayFamilyName(), 'online');
  }

  function schedulePush(payload) {
    if (!client || !familyInfo || applyingRemote) return;
    clearTimeout(pushTimer);
    const snapshot = JSON.parse(JSON.stringify(payload));
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
    await loadFamily();
    notify('Familie verbunden');
  }

  async function sendLogin(email) {
    const lastSent=Number(localStorage.getItem('fami-login-mail-sent')||0),remaining=60000-(Date.now()-lastSent);if(remaining>0)throw new Error(`Bitte noch ${Math.ceil(remaining/1000)} Sekunden warten, bevor du erneut einen Anmeldelink anforderst.`);
    const {error} = await client.auth.signInWithOtp({email, options:{emailRedirectTo:location.href.split('#')[0]}});
    if (error) throw error;
    localStorage.setItem('fami-login-mail-sent',String(Date.now()));
    notify('Anmeldelink wurde per E-Mail gesendet');
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
      host.innerHTML = `<p class="cloud-explain">Melde dich ohne Passwort an. Fami sendet dir einen sicheren Anmeldelink per E-Mail.</p><form id="cloudLoginForm"><label>E-Mail-Adresse<input id="cloudEmail" type="email" required autocomplete="email" inputmode="email"></label><button class="btn primary">Anmeldelink senden</button></form><p class="cloud-help">Du wurdest eingeladen? Öffne danach den Link aus der E-Mail auf diesem Gerät. Dein Familiencode bleibt im Einladungslink gespeichert.</p><p class="cloud-rate-note">Hinweis: Der kostenlose Supabase-Maildienst erlaubt nur 2 E-Mails pro Stunde. Bereits angemeldete Geräte bleiben angemeldet und benötigen keinen neuen Link.</p>`;
      document.querySelector('#cloudLoginForm').onsubmit = async event => {event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;button.textContent='Wird gesendet …';try{await sendLogin(document.querySelector('#cloudEmail').value.trim());button.textContent='E-Mail wurde gesendet'}catch(error){notify(friendlyAuthError(error));button.disabled=false;button.textContent='Anmeldelink senden'}};
      return;
    }
    if (!familyInfo) {
      const inviteCode=(new URLSearchParams(location.search).get('invite')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
      host.innerHTML = `<p class="cloud-explain">Erstelle eine neue Familie oder tritt mit dem Einladungscode einer bestehenden Familie bei.</p><div class="cloud-family-forms"><form id="createFamilyForm"><label>Neue Familie<input id="familyName" required placeholder="z. B. Familie Weber"></label><button class="btn primary">Familie erstellen</button></form><form id="joinFamilyForm"><label>Einladungscode<input id="familyCode" required maxlength="8" autocomplete="one-time-code" autocapitalize="characters" value="${escapeHtml(inviteCode)}" placeholder="AB12CD34"></label><button class="btn ghost">Familie beitreten</button></form></div><div class="cloud-mini-guide"><strong>Du wurdest eingeladen?</strong><ol><li>Der Code aus dem Einladungslink ist bereits eingesetzt.</li><li>Auf „Familie beitreten“ tippen.</li><li>Danach unter „Familie bearbeiten“ dein Profil für dieses Gerät auswählen.</li></ol></div>`;
      document.querySelector('#createFamilyForm').onsubmit = async event => {event.preventDefault();try{await createFamily(document.querySelector('#familyName').value.trim());renderSetup()}catch(error){notify(error.message)}};
      document.querySelector('#joinFamilyForm').onsubmit = async event => {event.preventDefault();try{await joinFamily(document.querySelector('#familyCode').value.trim());history.replaceState({},'',location.pathname);renderSetup()}catch(error){notify(error.message)}};
      return;
    }
    host.innerHTML = `<div class="cloud-connected"><span>✓</span><div><strong>${escapeHtml(displayFamilyName())}</strong><p>Live-Synchronisierung ist aktiv.</p></div></div><div class="invite-code"><small>Einladungscode für weitere Familienmitglieder</small><strong>${escapeHtml(familyInfo.invite_code)}</strong><button class="btn ghost" id="copyInvite">Nur Code kopieren</button><button class="btn primary" id="copyInvitation">Einladung mit Anleitung kopieren</button></div><div class="cloud-mini-guide"><strong>So funktioniert der Test</strong><ol><li>Einladung an die zweite Person senden.</li><li>Sie öffnet Fami auf ihrem eigenen Handy und meldet sich per E-Mail-Link an.</li><li>Sie wählt „Familie beitreten“ und gibt den Code ein.</li><li>Anschließend wählt sie unter „Familie bearbeiten“ ihr Profil aus.</li></ol><small>Den Code nur an vertraute Personen weitergeben – er erlaubt Zugriff auf eure gemeinsamen Daten.</small></div><button class="text-btn cloud-reset" id="cloudLogout">Von der Cloud abmelden</button>`;
    document.querySelector('#copyInvite').onclick = async () => {await navigator.clipboard.writeText(familyInfo.invite_code);notify('Einladungscode kopiert')};
    document.querySelector('#copyInvitation').onclick = async () => {const appUrl=`${location.origin}${location.pathname}?invite=${encodeURIComponent(familyInfo.invite_code)}`;const message=`Teste Fami mit mir: ${appUrl}\n\n1. Öffne den Link auf deinem Handy.\n2. Melde dich mit deiner eigenen E-Mail-Adresse an.\n3. Öffne den Anmeldelink aus der E-Mail auf demselben Gerät.\n4. Der Familiencode ${familyInfo.invite_code} ist bereits vorausgefüllt – tippe nur noch auf „Familie beitreten“.\n5. Wähle danach unter „Familie bearbeiten“ dein Profil aus.\n\nBitte teile den Link nicht mit anderen Personen.`;await navigator.clipboard.writeText(message);notify('Einladung mit persönlichem Link kopiert')};
    document.querySelector('#cloudLogout').onclick = async () => {await client.auth.signOut();localStorage.removeItem(FAMILY_KEY);location.reload()};
  }

  async function init(options) {
    if (initialized) return;
    initialized = true;
    callbacks = options;
    document.querySelector('#cloudStatus')?.addEventListener('click', openSetup);
    document.querySelectorAll('[data-cloud-close]').forEach(button => button.addEventListener('click', closeSetup));
    await connect();
  }

  window.FamiCloud = {
    init,
    openSetup,
    schedulePush,
    uploadFiles,
    listFiles,
    deleteFile,
    registerPush,
    isConnected:() => Boolean(client && familyInfo && session)
  };
})();
