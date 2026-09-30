const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const state = JSON.parse(localStorage.getItem('fami-state') || '{"completed":3,"customTasks":[]}');
let createType = 'task';
let timerStart = null;
let timerTick = null;
let installPrompt = null;

const today = new Date();
$('#dateLabel').textContent = today.toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'long' }).toUpperCase();
$('#itemDate').valueAsDate = today;

function save(){ localStorage.setItem('fami-state', JSON.stringify(state)); }
function toast(message){ const t=$('#toast'); $('p',t).textContent=message; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),2400); }

function updateProgress(){
  const checked = $$('.task input:checked').length;
  const total = $$('.task').length + 3;
  $('#doneCount').textContent = checked + 3;
  $('#taskCount').textContent = total - checked - 3;
  $('#taskProgress').style.width = `${((checked + 3) / total) * 100}%`;
}

function bindTask(label){
  $('input',label).addEventListener('change', () => { updateProgress(); toast($('input',label).checked ? 'Aufgabe erledigt – stark!' : 'Aufgabe wieder geöffnet'); });
}
$$('.task').forEach(bindTask);

state.customTasks.forEach(item => addTask(item, false));
function addTask(item, persist=true){
  const label=document.createElement('label'); label.className='task';
  const initial=(item.person||'L').charAt(0); const avatarClass={L:'lena',T:'tom',E:'emma',N:'noah'}[initial]||'lena';
  label.innerHTML=`<input type="checkbox"><span class="checkmark"></span><span class="task-copy"><strong></strong><small></small></span><span class="avatar ${avatarClass} mini">${initial}</span>`;
  $('strong',label).textContent=item.title; $('small',label).textContent=item.date||'Heute';
  $('#taskList').append(label); bindTask(label); if(persist){state.customTasks.push(item);save()} updateProgress();
}

function openModal(type='task'){
  createType=type; $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden','false');
  $$('.type-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
  setTimeout(()=>$('#itemTitle').focus(),100);
}
function closeModal(){ $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden','true'); }
$('#quickAdd').onclick=()=>openModal(); $('#mobileAdd').onclick=()=>openModal();
$$('[data-kind]').forEach(b=>b.onclick=()=>openModal(b.dataset.kind));
$$('[data-close]').forEach(b=>b.onclick=closeModal);
$$('.type-tabs button').forEach(b=>b.onclick=()=>{createType=b.dataset.type;$$('.type-tabs button').forEach(x=>x.classList.toggle('active',x===b))});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}});

$('#createForm').addEventListener('submit',e=>{
  e.preventDefault(); const title=$('#itemTitle').value.trim(); const person=$('#itemPerson').value; const date=$('#itemDate').value ? new Date($('#itemDate').value+'T12:00').toLocaleDateString('de-DE',{day:'2-digit',month:'short'}) : 'Heute';
  if(createType==='task') addTask({title,person,date});
  $('#createForm').reset(); $('#itemDate').valueAsDate=today; closeModal(); toast(`${createType==='event'?'Termin':createType==='note'?'Notiz':'Aufgabe'} für alle gespeichert`);
});

$('#timerBtn').addEventListener('click',()=>{
  if(timerTick){clearInterval(timerTick);timerTick=null;$('#timerBtn').classList.remove('running');$('#timerLabel').textContent='Timer pausiert';toast('Zeit wurde lokal gespeichert');return}
  timerStart=timerStart||Date.now();$('#timerBtn').classList.add('running');$('#timerLabel').textContent='Familienzeit läuft';
  timerTick=setInterval(()=>{const sec=Math.floor((Date.now()-timerStart)/1000);$('#timerValue').textContent=[Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(x=>String(x).padStart(2,'0')).join(':')},1000);
});

$('#fileInput').addEventListener('change',e=>{if(e.target.files.length)toast(`${e.target.files.length} ${e.target.files.length===1?'Datei wird':'Dateien werden'} sicher geteilt`)});
$('#inviteBtn').addEventListener('click',()=>toast('Einladungslink wurde kopiert'));

const views={
  calendar:{eyebrow:'GEMEINSAMER ÜBERBLICK',title:'Familienkalender',desc:'Alle Termine, farblich nach Person – ohne versteckte Einträge.',features:[['Persönliche Filter','Zeige alle oder nur deine eigenen Termine.'],['Sicher synchronisiert','Jede Änderung erscheint im Aktivitätsverlauf.'],['Wiederholungen','Schule, Sport und Routinen einmalig planen.']]},
  tasks:{eyebrow:'KLAR VERTEILT',title:'Aufgaben',desc:'Jeder weiß, was zu tun ist – freundlich und ohne Mikromanagement.',features:[['Faire Verteilung','Aufgaben nach Person und Belastung filtern.'],['Routinen','Wiederkehrende Aufgaben automatisch verteilen.'],['Gemeinsam erledigt','Kommentare, Anhänge und Checklisten an einem Ort.']]},
  time:{eyebrow:'ZEIT, DIE ZÄHLT',title:'Familienzeit',desc:'Gemeinsame Aktivitäten erfassen und bewusster Zeit miteinander verbringen.',features:[['Einfacher Timer','Ein Tipp genügt – Kategorien kommen danach.'],['Wochenrückblick','Gemeinsame Zeit auf einen Blick sehen.'],['Privat by Design','Keine Leistungswertung und kein Wettbewerb.']]},
  files:{eyebrow:'ALLES WICHTIGE',title:'Fotos & Dateien',desc:'Erinnerungen und Dokumente sicher mit der Familie teilen.',features:[['Gemeinsame Alben','Fotos sammeln, kommentieren und wiederfinden.'],['Dokumentenablage','Stundenpläne, Briefe und PDFs griffbereit.'],['Klare Rechte','Festlegen, wer ansehen, ergänzen oder löschen darf.']]}
};
function switchView(name){
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='home'){$('#homeView').classList.remove('hidden');$('#genericView').classList.add('hidden');return}
  const v=views[name];$('#homeView').classList.add('hidden');const box=$('#genericView');box.classList.remove('hidden');
  box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">${v.eyebrow}</p><h1>${v.title}</h1><p>${v.desc}</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neu erstellen</span></button></div><section class="empty-shell"><div class="feature-grid">${v.features.map(x=>`<article class="feature-item"><strong>${x[0]}</strong><p>${x[1]}</p></article>`).join('')}</div></section>`;
  $('.sub-add',box).onclick=()=>openModal(name==='calendar'?'event':name==='tasks'?'task':'note');
}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.target)));

$('#globalSearch').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase(); $$('.event,.task,.file-tile').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'':'none');
});
updateProgress();

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  $('#installApp').classList.remove('hidden');
});

$('#installApp').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') toast('Fami wird installiert');
  installPrompt = null;
  $('#installApp').classList.add('hidden');
});

window.addEventListener('appinstalled', () => toast('Fami ist jetzt auf deinem Gerät'));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}
