const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const defaults = [
  {id:'base-1',title:'Pfand wegbringen',person:'Tom',dateLabel:'Heute',date:'',note:'',done:false},
  {id:'base-2',title:'Elternbrief unterschreiben',person:'Lena',dateLabel:'Heute · wichtig',date:'',note:'Bitte morgen wieder in die Schultasche legen.',done:false},
  {id:'base-3',title:'Spülmaschine ausräumen',person:'Emma',dateLabel:'Heute',date:'',note:'',done:false},
  {id:'base-4',title:'Geburtstagsgeschenk bestellen',person:'Tom',dateLabel:'Morgen',date:'',note:'',done:false},
  {id:'base-5',title:'Pflanzen gießen',person:'Noah',dateLabel:'Freitag · wiederholt sich',date:'',note:'',done:false}
];
const family = ['Lena','Tom','Emma','Noah'];
const calendarEvents = [
  {id:'event-1',time:'08:00',title:'Zahnarzt Emma',place:'Praxis Dr. König · Prenzlauer Berg',people:['Emma'],color:'blue'},
  {id:'event-2',time:'10:30',title:'Wocheneinkauf',place:'Markthalle · Liste ist geteilt',people:['Lena','Tom'],color:'coral'},
  {id:'event-3',time:'15:30',title:'Fußballtraining Noah',place:'Sportplatz Nord',people:['Noah'],color:'yellow'},
  {id:'event-4',time:'18:30',title:'Gemeinsames Abendessen',place:'Zuhause · Lasagne',people:['Lena','Tom','Emma','Noah'],color:'green'}
];
const stored = JSON.parse(localStorage.getItem('fami-state') || '{}');
const migratedCustom = (stored.customTasks || []).map((task,index) => ({
  id:task.id || `custom-${Date.now()}-${index}`, title:task.title, person:task.person || 'Lena',
  date:task.rawDate || '', dateLabel:task.date || 'Heute', note:task.note || '', done:false
}));
const state = {
  tasks: Array.isArray(stored.tasks) ? stored.tasks : [...defaults, ...migratedCustom],
  deletedIds: stored.deletedIds || [],
  taskPeople: stored.taskPeople || [...family],
  calendarPeople: stored.calendarPeople || [...family]
};
state.tasks = state.tasks.filter(task => !state.deletedIds.includes(task.id));

let createType = 'task';
let taskFilter = 'open';
let timerStart = null;
let timerTick = null;
let installPrompt = null;
const today = new Date();

$('#dateLabel').textContent = today.toLocaleDateString('de-DE', {weekday:'long',day:'2-digit',month:'long'}).toUpperCase();
$('#itemDate').valueAsDate = today;

function save(){ localStorage.setItem('fami-state', JSON.stringify(state)); }
function toast(message){ const t=$('#toast'); $('p',t).textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2400); }
function initials(person){ return person === 'Alle' ? 'A' : person.charAt(0); }
function avatarClass(person){ return {Lena:'lena',Tom:'tom',Emma:'emma',Noah:'noah'}[person] || 'lena'; }
function prettyDate(raw, fallback='Heute'){
  return raw ? new Date(`${raw}T12:00`).toLocaleDateString('de-DE',{day:'2-digit',month:'short'}) : fallback;
}
function getTask(id){ return state.tasks.find(task => task.id === id); }
function isVisible(person, kind='task'){ return state[kind==='task'?'taskPeople':'calendarPeople'].includes(person) || person === 'Alle'; }

function taskLabel(task){
  const label=document.createElement('label');
  label.className='task'; label.dataset.taskId=task.id;
  label.innerHTML=`<input type="checkbox"><span class="checkmark"></span><span class="task-copy"><strong></strong><small></small></span><span class="avatar ${avatarClass(task.person)} mini">${initials(task.person)}</span>`;
  $('input',label).checked=task.done; $('strong',label).textContent=task.title; $('small',label).textContent=task.dateLabel || prettyDate(task.date);
  $('input',label).addEventListener('change',()=>setDone(task.id,$('input',label).checked));
  return label;
}

function renderHomeTasks(){
  const list=$('#taskList'); list.innerHTML='';
  state.tasks.filter(task=>!task.done && isVisible(task.person)).slice(0,5).forEach(task=>list.append(taskLabel(task)));
  if(!list.children.length) list.innerHTML='<p class="task-empty">Alles erledigt – wunderbar!</p>';
  updateProgress();
}

function updateProgress(){
  const visible=state.tasks.filter(task=>isVisible(task.person));const total=visible.length; const done=visible.filter(task=>task.done).length;
  $('#doneCount').textContent=done; $('.tasks-card .card-head p').innerHTML=`<span id="doneCount">${done}</span> von ${total} erledigt`;
  $('#taskCount').textContent=Math.max(total-done,0); $('#taskProgress').style.width=`${total ? done/total*100 : 0}%`;
}

function setDone(id,done){
  const task=getTask(id); if(!task)return; task.done=done;save();renderHomeTasks();renderTaskManager();toast(done?'Aufgabe erledigt – stark!':'Aufgabe wieder geöffnet');
}

function renderTaskManager(){
  const host=$('#managedTasks'); if(!host)return;
  const tasks=state.tasks.filter(task=>isVisible(task.person) && (taskFilter==='all'||(taskFilter==='done'?task.done:!task.done)));
  host.innerHTML='';
  tasks.forEach(task=>{
    const row=document.createElement('article');row.className=`managed-task${task.done?' done':''}`;row.dataset.taskId=task.id;
    row.innerHTML=`<label><input class="managed-check" type="checkbox" ${task.done?'checked':''}><span class="checkmark"></span></label><div class="managed-copy"><strong></strong><small></small></div><span class="avatar ${avatarClass(task.person)} mini">${initials(task.person)}</span><button class="edit-task-btn">Bearbeiten</button>`;
    $('.managed-copy strong',row).textContent=task.title;
    $('.managed-copy small',row).textContent=`${task.dateLabel||prettyDate(task.date)} · ${task.person}`;
    $('.managed-check',row).onchange=e=>setDone(task.id,e.target.checked);
    $('.edit-task-btn',row).onclick=()=>openTaskEditor(task.id);
    host.append(row);
  });
  if(!tasks.length)host.innerHTML='<div class="task-empty">Hier sind gerade keine Aufgaben.</div>';
  const visible=state.tasks.filter(task=>isVisible(task.person));const count=$('#managerCount');if(count)count.textContent=`${visible.filter(t=>!t.done).length} offen · ${visible.filter(t=>t.done).length} erledigt`;
}

function peoplePicker(kind){
  const selected=state[kind==='task'?'taskPeople':'calendarPeople'];
  return `<div class="people-filter"><span>Anzeigen für</span><div>${family.map(person=>`<button class="person-chip ${selected.includes(person)?'active':''}" data-person="${person}" data-kind="${kind}"><span class="avatar ${avatarClass(person)} mini">${initials(person)}</span>${person==='Lena'?'Ich':person}</button>`).join('')}</div><small>Du kannst als Elternteil die Aufgaben und Termine der Kinder zusätzlich einblenden.</small></div>`;
}
function bindPeoplePicker(root,kind){
  $$('.person-chip',root).forEach(button=>button.onclick=()=>{
    const key=kind==='task'?'taskPeople':'calendarPeople';const person=button.dataset.person;
    if(state[key].includes(person)){if(state[key].length===1){toast('Mindestens eine Person muss sichtbar bleiben');return}state[key]=state[key].filter(item=>item!==person)}else state[key].push(person);
    save();button.classList.toggle('active',state[key].includes(person));
    if(kind==='task'){renderHomeTasks();renderTaskManager()}else{applyHomeCalendarFilter();renderCalendarManager()}
  });
}

function applyHomeCalendarFilter(){
  $$('.timeline .event').forEach((element,index)=>{const event=calendarEvents[index];element.style.display=event.people.some(person=>state.calendarPeople.includes(person))?'':'none'});
  const visible=calendarEvents.filter(event=>event.people.some(person=>state.calendarPeople.includes(person))).length;
  $('.schedule-card .card-head p').textContent=`${visible} Termine`;
}

function renderCalendarManager(){
  const host=$('#calendarEntries');if(!host)return;host.innerHTML='';
  calendarEvents.filter(event=>event.people.some(person=>state.calendarPeople.includes(person))).forEach(event=>{
    const row=document.createElement('article');row.className='calendar-entry';
    row.innerHTML=`<time>${event.time}</time><i class="${event.color}"></i><div><strong></strong><small></small><div class="calendar-people"></div></div>`;
    $('strong',row).textContent=event.title;$('small',row).textContent=event.place;
    event.people.forEach(person=>{$('.calendar-people',row).insertAdjacentHTML('beforeend',`<span class="avatar ${avatarClass(person)} mini">${initials(person)}</span>`)});host.append(row);
  });
  if(!host.children.length)host.innerHTML='<div class="task-empty">Für diese Auswahl gibt es keine Termine.</div>';
}

function openModal(type='task'){
  createType=type;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false');
  $$('.type-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));setTimeout(()=>$('#itemTitle').focus(),100);
}
function closeModal(){ $('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true'); }
function openTaskEditor(id){
  const task=getTask(id);if(!task)return;
  $('#editTaskId').value=id;$('#editTaskName').value=task.title;$('#editTaskDate').value=task.date||'';$('#editTaskPerson').value=task.person;$('#editTaskNote').value=task.note||'';$('#editTaskDone').checked=task.done;
  $('#editTaskModal').classList.add('open');$('#editTaskModal').setAttribute('aria-hidden','false');setTimeout(()=>$('#editTaskName').focus(),80);
}
function closeTaskEditor(){ $('#editTaskModal').classList.remove('open');$('#editTaskModal').setAttribute('aria-hidden','true'); }

$('#quickAdd').onclick=()=>openModal();$('#mobileAdd').onclick=()=>openModal();
$$('[data-kind]').forEach(b=>b.onclick=()=>openModal(b.dataset.kind));$$('[data-close]').forEach(b=>b.onclick=closeModal);$$('[data-edit-close]').forEach(b=>b.onclick=closeTaskEditor);
$$('.type-tabs button').forEach(b=>b.onclick=()=>{createType=b.dataset.type;$$('.type-tabs button').forEach(x=>x.classList.toggle('active',x===b))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeTaskEditor()}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}});

$('#createForm').addEventListener('submit',e=>{
  e.preventDefault();const title=$('#itemTitle').value.trim();const person=$('#itemPerson').value;const rawDate=$('#itemDate').value;
  if(createType==='task'){
    state.tasks.push({id:`task-${Date.now()}`,title,person,date:rawDate,dateLabel:prettyDate(rawDate),note:$('#itemDetails').value.trim(),done:false});save();renderHomeTasks();renderTaskManager();
  }
  $('#createForm').reset();$('#itemDate').valueAsDate=today;closeModal();toast(`${createType==='event'?'Termin':createType==='note'?'Notiz':'Aufgabe'} für alle gespeichert`);
});

$('#editTaskForm').addEventListener('submit',e=>{
  e.preventDefault();const task=getTask($('#editTaskId').value);if(!task)return;
  task.title=$('#editTaskName').value.trim();task.date=$('#editTaskDate').value;task.dateLabel=prettyDate(task.date,task.dateLabel);task.person=$('#editTaskPerson').value;task.note=$('#editTaskNote').value.trim();task.done=$('#editTaskDone').checked;
  save();renderHomeTasks();renderTaskManager();closeTaskEditor();toast('Aufgabe wurde aktualisiert');
});

$('#deleteTask').addEventListener('click',()=>{
  const id=$('#editTaskId').value;const task=getTask(id);if(!task)return;
  state.tasks=state.tasks.filter(item=>item.id!==id);state.deletedIds.push(id);save();renderHomeTasks();renderTaskManager();closeTaskEditor();toast('Aufgabe wurde gelöscht');
});

$('#timerBtn').addEventListener('click',()=>{
  if(timerTick){clearInterval(timerTick);timerTick=null;$('#timerBtn').classList.remove('running');$('#timerLabel').textContent='Timer pausiert';toast('Zeit wurde lokal gespeichert');return}
  timerStart=timerStart||Date.now();$('#timerBtn').classList.add('running');$('#timerLabel').textContent='Familienzeit läuft';timerTick=setInterval(()=>{const sec=Math.floor((Date.now()-timerStart)/1000);$('#timerValue').textContent=[Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(x=>String(x).padStart(2,'0')).join(':')},1000);
});

$('#fileInput').addEventListener('change',e=>{if(e.target.files.length)toast(`${e.target.files.length} ${e.target.files.length===1?'Datei wird':'Dateien werden'} sicher geteilt`)});$('#inviteBtn').onclick=()=>toast('Einladungslink wurde kopiert');

const views={
  calendar:{eyebrow:'GEMEINSAMER ÜBERBLICK',title:'Familienkalender',desc:'Alle Termine, farblich nach Person – ohne versteckte Einträge.',features:[['Persönliche Filter','Zeige alle oder nur deine eigenen Termine.'],['Sicher synchronisiert','Jede Änderung erscheint im Aktivitätsverlauf.'],['Wiederholungen','Schule, Sport und Routinen einmalig planen.']]},
  time:{eyebrow:'ZEIT, DIE ZÄHLT',title:'Familienzeit',desc:'Gemeinsame Aktivitäten erfassen und bewusster Zeit miteinander verbringen.',features:[['Einfacher Timer','Ein Tipp genügt – Kategorien kommen danach.'],['Wochenrückblick','Gemeinsame Zeit auf einen Blick sehen.'],['Privat by Design','Keine Leistungswertung und kein Wettbewerb.']]},
  files:{eyebrow:'ALLES WICHTIGE',title:'Fotos & Dateien',desc:'Erinnerungen und Dokumente sicher mit der Familie teilen.',features:[['Gemeinsame Alben','Fotos sammeln, kommentieren und wiederfinden.'],['Dokumentenablage','Stundenpläne, Briefe und PDFs griffbereit.'],['Klare Rechte','Festlegen, wer ansehen, ergänzen oder löschen darf.']]}
};
function switchView(name){
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='home'){$('#homeView').classList.remove('hidden');$('#genericView').classList.add('hidden');return}
  $('#homeView').classList.add('hidden');const box=$('#genericView');box.classList.remove('hidden');
  if(name==='tasks'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">KLAR VERTEILT</p><h1>Aufgaben</h1><p>Alle Aufgaben bearbeiten, neu verteilen oder als erledigt markieren.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neue Aufgabe</span></button></div>${peoplePicker('task')}<section class="empty-shell"><div class="task-tools"><div class="task-filters"><button class="active" data-filter="open">Offen</button><button data-filter="done">Erledigt</button><button data-filter="all">Alle</button></div><p id="managerCount"></p></div><div class="task-manager" id="managedTasks"></div></section>`;
    $('.sub-add',box).onclick=()=>openModal('task');$$('[data-filter]',box).forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$('[data-filter]',box).forEach(x=>x.classList.toggle('active',x===b));renderTaskManager()});bindPeoplePicker(box,'task');renderTaskManager();return;
  }
  if(name==='calendar'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">GEMEINSAMER ÜBERBLICK</p><h1>Familienkalender</h1><p>Wähle aus, wessen Termine du sehen möchtest.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neuer Termin</span></button></div>${peoplePicker('calendar')}<section class="empty-shell"><div class="calendar-manager" id="calendarEntries"></div></section>`;
    $('.sub-add',box).onclick=()=>openModal('event');bindPeoplePicker(box,'calendar');renderCalendarManager();return;
  }
  const v=views[name];box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">${v.eyebrow}</p><h1>${v.title}</h1><p>${v.desc}</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neu erstellen</span></button></div><section class="empty-shell"><div class="feature-grid">${v.features.map(x=>`<article class="feature-item"><strong>${x[0]}</strong><p>${x[1]}</p></article>`).join('')}</div></section>`;$('.sub-add',box).onclick=()=>openModal(name==='calendar'?'event':'note');
}
$$('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));$$('.nav-link').forEach(b=>b.onclick=()=>switchView(b.dataset.target));
$('#globalSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('.event,.task,.file-tile').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'':'none')});

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('#installApp').classList.remove('hidden')});
$('#installApp').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')toast('Fami wird installiert');installPrompt=null;$('#installApp').classList.add('hidden')};
window.addEventListener('appinstalled',()=>toast('Fami ist jetzt auf deinem Gerät'));
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));

renderHomeTasks();applyHomeCalendarFilter();save();
