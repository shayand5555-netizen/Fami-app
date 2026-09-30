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
const defaultEvents = [
  {id:'event-1',date:'',time:'08:00',title:'Zahnarzt Emma',place:'Praxis Dr. König · Prenzlauer Berg',people:['Emma'],color:'blue'},
  {id:'event-2',date:'',time:'10:30',title:'Wocheneinkauf',place:'Markthalle · Liste ist geteilt',people:['Lena','Tom'],color:'coral'},
  {id:'event-3',date:'',time:'15:30',title:'Fußballtraining Noah',place:'Sportplatz Nord',people:['Noah'],color:'yellow'},
  {id:'event-4',date:'',time:'18:30',title:'Gemeinsames Abendessen',place:'Zuhause · Lasagne',people:['Lena','Tom','Emma','Noah'],color:'green'}
];
const activityIdeas = [
  {icon:'🎃',title:'Kürbisfest & Herbstmarkt',category:'Feste',ages:'3–14 Jahre',distance:'ca. 12 km',when:'Dieses Wochenende',text:'Kürbisschnitzen, Strohburg und regionale Leckereien.'},
  {icon:'🦕',title:'Familientag im Museum',category:'Drinnen',ages:'5–16 Jahre',distance:'ca. 4 km',when:'Sonntag',text:'Mitmachstationen und eine kindgerechte Entdeckungstour.'},
  {icon:'🌲',title:'Wald-Rallye für Familien',category:'Draußen',ages:'4–12 Jahre',distance:'ca. 8 km',when:'Nächsten Samstag',text:'Gemeinsam Spuren suchen und kleine Naturaufgaben lösen.'},
  {icon:'🎭',title:'Kinder- und Jugendtheater',category:'Kultur',ages:'6–15 Jahre',distance:'ca. 6 km',when:'In 9 Tagen',text:'Familienvorstellung am Nachmittag mit anschließendem Gespräch.'}
];
const recipes = [
  {id:'protein-reis',emoji:'🍚',title:'Knuspriger High-Protein-Reis',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=cc2hsZIiNts',time:'45 Min.',portions:'Meal Prep · 3 Tage',tags:['High Protein','Meal Prep'],ingredients:[['Reis','600 g'],['Hähnchen','600 g'],['Möhren','5 Stück'],['Lauchzwiebeln','1 Bund'],['Gurke','1 Stück'],['Grüner Salat','1 Kopf'],['Knoblauch','1 Zehe'],['Erdnussbutter','2 EL'],['Sojasauce','100 ml'],['Essig','1 TL'],['Mandelmilch','1 Schuss'],['Honig','1 TL'],['Olivenöl','etwas']]},
  {id:'teriyaki-bowl',emoji:'🥗',title:'Teriyaki-Hähnchen-Bowl',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=fN6bewxD94o',time:'40 Min.',portions:'3–4 Portionen',tags:['Proteinreich','Familientauglich'],ingredients:[['Tomaten','3 Stück'],['Zwiebel','1 Stück'],['Knoblauch','3 Zehen'],['Paprika','1 Stück'],['Peperoni','1 Stück'],['Petersilie','1 Bund'],['Limette','1 Stück'],['Reis','300 g'],['Hähnchen','500 g'],['Teriyaki-Sauce','100 ml'],['Eisbergsalat','1 Kopf']]},
  {id:'granola',emoji:'🥣',title:'Protein-Frühstück mit Granola',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=fN6bewxD94o',time:'25 Min.',portions:'Mehrere Frühstücke',tags:['Frühstück','Vorbereiten'],ingredients:[['Haferflocken','200 g'],['Honig','120 g'],['Erdnussbutter','30 g'],['Walnusskerne','30 g'],['Mandelsplitter','30 g'],['Haselnüsse','30 g'],['Kürbiskerne','30 g'],['Sesam','etwas'],['Skyr oder Quark','nach Bedarf'],['Äpfel','3 Stück']]}
];
const stored = JSON.parse(localStorage.getItem('fami-state') || '{}');
const migratedCustom = (stored.customTasks || []).map((task,index) => ({
  id:task.id || `custom-${Date.now()}-${index}`, title:task.title, person:task.person || 'Lena',
  date:task.rawDate || '', dateLabel:task.date || 'Heute', note:task.note || '', done:false
}));
const state = {
  tasks: Array.isArray(stored.tasks) ? stored.tasks : [...defaults, ...migratedCustom],
  events: Array.isArray(stored.events) ? stored.events : defaultEvents,
  deletedIds: stored.deletedIds || [],
  taskPeople: stored.taskPeople || [...family],
  calendarPeople: stored.calendarPeople || [...family],
  familyProfile: stored.familyProfile || {location:'Berlin',emmaAge:10,noahAge:7},
  holidaySettings: stored.holidaySettings || {subdivision:'DE-BE',showPublic:true,showSchool:true},
  shoppingItems: stored.shoppingItems || []
};
state.tasks = state.tasks.filter(task => !state.deletedIds.includes(task.id));

let createType = 'task';
let taskFilter = 'open';
let installPrompt = null;
const today = new Date();
let calendarCursor = new Date(today.getFullYear(),today.getMonth(),1);
let holidayData = {public:[],school:[]};
const subdivisions = {'DE-BW':'Baden-Württemberg','DE-BY':'Bayern','DE-BE':'Berlin','DE-BB':'Brandenburg','DE-HB':'Bremen','DE-HH':'Hamburg','DE-HE':'Hessen','DE-MV':'Mecklenburg-Vorpommern','DE-NI':'Niedersachsen','DE-NW':'Nordrhein-Westfalen','DE-RP':'Rheinland-Pfalz','DE-SL':'Saarland','DE-SN':'Sachsen','DE-ST':'Sachsen-Anhalt','DE-SH':'Schleswig-Holstein','DE-TH':'Thüringen'};

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

function openFileDb(){
  return new Promise((resolve,reject)=>{const request=indexedDB.open('fami-files',1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('attachments')){const store=db.createObjectStore('attachments',{keyPath:'id'});store.createIndex('entity','entity')}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
}
async function storeAttachments(entity,files){
  if(!files?.length)return;const db=await openFileDb();const tx=db.transaction('attachments','readwrite');const store=tx.objectStore('attachments');
  [...files].forEach(file=>store.put({id:`${entity}-${Date.now()}-${Math.random()}`,entity,name:file.name,type:file.type,size:file.size,blob:file}));
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
}
async function getAttachments(entity){
  const db=await openFileDb();const tx=db.transaction('attachments','readonly');const req=tx.objectStore('attachments').index('entity').getAll(entity);const result=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();return result;
}
async function getAllAttachments(){const db=await openFileDb();const tx=db.transaction('attachments','readonly');const req=tx.objectStore('attachments').getAll();const result=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();return result}
async function removeAttachment(id){const db=await openFileDb();const tx=db.transaction('attachments','readwrite');tx.objectStore('attachments').delete(id);await new Promise(resolve=>tx.oncomplete=resolve);db.close()}
async function renderAttachments(entity,host){
  const files=await getAttachments(entity);host.innerHTML='';files.forEach(file=>{const row=document.createElement('div');row.className='attachment';row.innerHTML='<button class="attachment-open"></button><small></small><button class="attachment-delete" aria-label="Anhang löschen">×</button>';$('.attachment-open',row).textContent=file.name;$('small',row).textContent=`${Math.max(1,Math.round(file.size/1024))} KB`;$('.attachment-open',row).onclick=()=>{const url=URL.createObjectURL(file.blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('.attachment-delete',row).onclick=async()=>{await removeAttachment(file.id);renderAttachments(entity,host);toast('Anhang gelöscht')};host.append(row)});
}

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
    if(kind==='task'){renderHomeTasks();renderTaskManager()}else{applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar()}
  });
}

function eventVisible(event){ return event.people.some(person=>state.calendarPeople.includes(person)); }
function eventPeople(value){ return value === 'Alle' ? [...family] : [value]; }
function getEvent(id){ return state.events.find(event=>event.id===id); }

function applyHomeCalendarFilter(){
  const host=$('#timeline');host.innerHTML='';
  const visible=state.events.filter(eventVisible).sort((a,b)=>a.time.localeCompare(b.time));
  visible.slice(0,5).forEach(event=>{
    const row=document.createElement('article');row.className='event';row.dataset.eventId=event.id;
    row.innerHTML=`<time>${event.time}</time><div class="event-line ${event.color}"></div><div class="event-body"><strong></strong><p></p><div class="event-avatars"></div></div><button class="edit-event-mini" aria-label="Termin bearbeiten">Bearbeiten</button>`;
    $('.event-body strong',row).textContent=event.title;$('.event-body p',row).textContent=event.place||'Keine Ortsangabe';
    event.people.forEach(person=>$('.event-avatars',row).insertAdjacentHTML('beforeend',`<span class="avatar ${avatarClass(person)} mini">${initials(person)}</span>`));
    $('.edit-event-mini',row).onclick=()=>openEventEditor(event.id);host.append(row);
  });
  if(!visible.length)host.innerHTML='<p class="task-empty">Für deine Auswahl gibt es keine Termine.</p>';
  $('.schedule-card .card-head p').textContent=`${visible.length} Termine`;
}

function renderCalendarManager(){
  const host=$('#calendarEntries');if(!host)return;host.innerHTML='';
  state.events.filter(eventVisible).sort((a,b)=>a.time.localeCompare(b.time)).forEach(event=>{
    const row=document.createElement('article');row.className='calendar-entry';
    row.innerHTML=`<time>${event.time}</time><i class="${event.color}"></i><div><strong></strong><small></small><div class="calendar-people"></div></div><button class="edit-task-btn edit-calendar-btn">Bearbeiten</button>`;
    $('strong',row).textContent=event.title;$('small',row).textContent=event.place;
    event.people.forEach(person=>{$('.calendar-people',row).insertAdjacentHTML('beforeend',`<span class="avatar ${avatarClass(person)} mini">${initials(person)}</span>`)});$('.edit-calendar-btn',row).onclick=()=>openEventEditor(event.id);host.append(row);
  });
  if(!host.children.length)host.innerHTML='<div class="task-empty">Für diese Auswahl gibt es keine Termine.</div>';
}

function isoDate(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function localizedName(item){const names=item.name||item.names||[];return names.find(entry=>(entry.language||entry.languageIsoCode||'').toUpperCase()==='DE')?.text||names[0]?.text||item.name||'Freier Tag'}
async function loadHolidayData(){
  const year=calendarCursor.getFullYear();const base='https://openholidaysapi.org';const query=`countryIsoCode=DE&subdivisionCode=${state.holidaySettings.subdivision}&languageIsoCode=DE&validFrom=${year}-01-01&validTo=${year}-12-31`;
  try{const [pub,school]=await Promise.all([fetch(`${base}/PublicHolidays?${query}`),fetch(`${base}/SchoolHolidays?${query}`)]);holidayData={public:pub.ok?await pub.json():[],school:school.ok?await school.json():[]};renderMonthCalendar()}catch{holidayData={public:[],school:[]};renderMonthCalendar();const note=$('#holidayStatus');if(note)note.textContent='Ferien- und Feiertagsdaten konnten offline nicht aktualisiert werden.'}
}
function weekNumber(date){const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const start=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-start)/86400000)+1)/7)}
function holidayItemsFor(date){
  const iso=isoDate(date);const result=[];
  if(state.holidaySettings.showPublic)holidayData.public.forEach(item=>{if(iso>=item.startDate&&iso<=(item.endDate||item.startDate))result.push({name:localizedName(item),type:'public'})});
  if(state.holidaySettings.showSchool)holidayData.school.forEach(item=>{if(iso>=item.startDate&&iso<=(item.endDate||item.startDate))result.push({name:localizedName(item),type:'school'})});
  return result;
}
function renderMonthCalendar(){
  const host=$('#monthCalendar');if(!host)return;const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  const first=new Date(year,month,1);const mondayOffset=(first.getDay()+6)%7;const gridStart=new Date(year,month,1-mondayOffset);
  $('#monthTitle').textContent=calendarCursor.toLocaleDateString('de-DE',{month:'long',year:'numeric'});
  host.innerHTML='<div class="month-week-head">KW</div>'+['Mo','Di','Mi','Do','Fr','Sa','So'].map(day=>`<div class="month-week-head">${day}</div>`).join('');
  for(let week=0;week<6;week++){
    const weekDate=new Date(gridStart);weekDate.setDate(gridStart.getDate()+week*7);host.insertAdjacentHTML('beforeend',`<div class="week-number">${weekNumber(weekDate)}</div>`);
    for(let day=0;day<7;day++){
      const date=new Date(gridStart);date.setDate(gridStart.getDate()+week*7+day);const iso=isoDate(date);const outside=date.getMonth()!==month;const isToday=iso===isoDate(today);
      const events=state.events.filter(event=>eventVisible(event)&&(event.date||isoDate(today))===iso);
      const holidays=holidayItemsFor(date);
      const cell=document.createElement('div');cell.className=`month-day${outside?' outside':''}${isToday?' today':''}`;cell.innerHTML=`<span class="day-number">${date.getDate()}</span><div class="day-items"></div>`;
      holidays.slice(0,2).forEach(item=>$('.day-items',cell).insertAdjacentHTML('beforeend',`<span class="calendar-pill ${item.type}">${item.name}</span>`));
      events.slice(0,3).forEach(event=>{const pill=document.createElement('button');pill.className=`calendar-pill event-pill ${event.color}`;pill.textContent=event.title;pill.onclick=()=>openEventEditor(event.id);$('.day-items',cell).append(pill)});
      if(holidays.length+events.length>3)$('.day-items',cell).insertAdjacentHTML('beforeend',`<small>+${holidays.length+events.length-3} weitere</small>`);host.append(cell);
    }
  }
}

function openModal(type='task'){
  createType=type;$('#modal').classList.add('open');$('#modal').setAttribute('aria-hidden','false');
  $$('.type-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));setTimeout(()=>$('#itemTitle').focus(),100);
}
function closeModal(){ $('#modal').classList.remove('open');$('#modal').setAttribute('aria-hidden','true'); }
async function openTaskEditor(id){
  const task=getTask(id);if(!task)return;
  $('#editTaskId').value=id;$('#editTaskName').value=task.title;$('#editTaskDate').value=task.date||'';$('#editTaskPerson').value=task.person;$('#editTaskNote').value=task.note||'';$('#editTaskDone').checked=task.done;
  $('#editTaskModal').classList.add('open');$('#editTaskModal').setAttribute('aria-hidden','false');await renderAttachments(`task:${id}`,$('#taskAttachments'));setTimeout(()=>$('#editTaskName').focus(),80);
}
function closeTaskEditor(){ $('#editTaskModal').classList.remove('open');$('#editTaskModal').setAttribute('aria-hidden','true'); }
async function openEventEditor(id){
  const event=getEvent(id);if(!event)return;
  $('#editEventId').value=id;$('#editEventName').value=event.title;$('#editEventDate').value=event.date||today.toISOString().slice(0,10);$('#editEventTime').value=event.time;$('#editEventPerson').value=event.people.length===family.length?'Alle':event.people[0];$('#editEventColor').value=event.color;$('#editEventPlace').value=event.place||'';
  $('#editEventModal').classList.add('open');$('#editEventModal').setAttribute('aria-hidden','false');await renderAttachments(`event:${id}`,$('#eventAttachments'));setTimeout(()=>$('#editEventName').focus(),80);
}
function closeEventEditor(){ $('#editEventModal').classList.remove('open');$('#editEventModal').setAttribute('aria-hidden','true'); }

$('#quickAdd').onclick=()=>openModal();$('#mobileAdd').onclick=()=>openModal();
$$('[data-kind]').forEach(b=>b.onclick=()=>openModal(b.dataset.kind));$$('[data-close]').forEach(b=>b.onclick=closeModal);$$('[data-edit-close]').forEach(b=>b.onclick=closeTaskEditor);$$('[data-event-close]').forEach(b=>b.onclick=closeEventEditor);
$$('.type-tabs button').forEach(b=>b.onclick=()=>{createType=b.dataset.type;$$('.type-tabs button').forEach(x=>x.classList.toggle('active',x===b))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeTaskEditor();closeEventEditor()}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}});

$('#createForm').addEventListener('submit',async e=>{
  e.preventDefault();const title=$('#itemTitle').value.trim();const person=$('#itemPerson').value;const rawDate=$('#itemDate').value;
  if(createType==='task'){
    const id=`task-${Date.now()}`;state.tasks.push({id,title,person,date:rawDate,dateLabel:prettyDate(rawDate),note:$('#itemDetails').value.trim(),done:false});await storeAttachments(`task:${id}`,$('#newItemFiles').files);save();renderHomeTasks();renderTaskManager();
  }
  if(createType==='event'){
    const id=`event-${Date.now()}`;state.events.push({id,title,date:rawDate,time:'12:00',place:$('#itemDetails').value.trim(),people:eventPeople(person),color:'green'});await storeAttachments(`event:${id}`,$('#newItemFiles').files);save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();
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

$('#editEventForm').addEventListener('submit',e=>{
  e.preventDefault();const event=getEvent($('#editEventId').value);if(!event)return;
  event.title=$('#editEventName').value.trim();event.date=$('#editEventDate').value;event.time=$('#editEventTime').value;event.people=eventPeople($('#editEventPerson').value);event.color=$('#editEventColor').value;event.place=$('#editEventPlace').value.trim();
  save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();closeEventEditor();toast('Kalendereintrag wurde aktualisiert');
});

$('#deleteEvent').addEventListener('click',()=>{
  const id=$('#editEventId').value;state.events=state.events.filter(event=>event.id!==id);save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();closeEventEditor();toast('Kalendereintrag wurde gelöscht');
});

$('#taskAttachmentInput').addEventListener('change',async e=>{const id=$('#editTaskId').value;await storeAttachments(`task:${id}`,e.target.files);await renderAttachments(`task:${id}`,$('#taskAttachments'));e.target.value='';toast('Anhang hinzugefügt')});
$('#eventAttachmentInput').addEventListener('change',async e=>{const id=$('#editEventId').value;await storeAttachments(`event:${id}`,e.target.files);await renderAttachments(`event:${id}`,$('#eventAttachments'));e.target.value='';toast('Anhang hinzugefügt')});

$('#fileInput').addEventListener('change',async e=>{if(e.target.files.length){await storeAttachments('general:shared',e.target.files);toast(`${e.target.files.length} ${e.target.files.length===1?'Datei wurde':'Dateien wurden'} lokal gespeichert`);e.target.value=''}});$('#inviteBtn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('Testlink kopiert – Daten werden noch nicht synchronisiert')}catch{toast('Testlink: '+location.href)}};

function shoppingCategory(name){const value=name.toLowerCase();if(/hähnchen|fleisch|fisch/.test(value))return'Fleisch & Protein';if(/salat|tomat|möhr|gurke|paprika|zwiebel|knoblauch|limette|apfel|peperoni|petersilie|lauch/.test(value))return'Obst & Gemüse';if(/skyr|quark|milch/.test(value))return'Kühlregal';if(/reis|hafer|nüss|mandel|sesam|kern/.test(value))return'Vorrat';return'Sonstiges'}
function addShoppingItem(name,quantity='1',source='Manuell'){
  const existing=state.shoppingItems.find(item=>item.name.toLowerCase()===name.toLowerCase()&&!item.done);
  if(existing)existing.quantity=existing.quantity===quantity?existing.quantity:`${existing.quantity} + ${quantity}`;else state.shoppingItems.push({id:`shop-${Date.now()}-${Math.random()}`,name,quantity,category:shoppingCategory(name),done:false,source});save();updateShoppingCount();
}
function updateShoppingCount(){const badge=$('#shoppingCount');if(badge)badge.textContent=state.shoppingItems.filter(item=>!item.done).length}
function renderShoppingList(){
  const host=$('#shoppingList');if(!host)return;host.innerHTML='';const groups=[...new Set(state.shoppingItems.map(item=>item.category))];
  groups.forEach(category=>{const section=document.createElement('section');section.className='shopping-group';section.innerHTML=`<h3>${category}</h3><div></div>`;state.shoppingItems.filter(item=>item.category===category).forEach(item=>{const row=document.createElement('label');row.className=`shopping-item${item.done?' done':''}`;row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span class="checkmark"></span><span class="shopping-name"></span><strong></strong><small></small><button type="button" aria-label="Löschen">×</button>`;$('.shopping-name',row).textContent=item.name;$('strong',row).textContent=item.quantity;$('small',row).textContent=item.source;$('input',row).onchange=e=>{item.done=e.target.checked;save();renderShoppingList();updateShoppingCount()};$('button',row).onclick=e=>{e.preventDefault();state.shoppingItems=state.shoppingItems.filter(x=>x.id!==item.id);save();renderShoppingList();updateShoppingCount()};$('div',section).append(row)});host.append(section)});
  if(!state.shoppingItems.length)host.innerHTML='<div class="task-empty">Die Einkaufsliste ist leer. Füge etwas hinzu oder übernimm Zutaten aus einem Rezept.</div>';
}
function addRecipeToShopping(recipe){recipe.ingredients.forEach(([name,quantity])=>addShoppingItem(name,quantity,recipe.title));toast(`${recipe.ingredients.length} Zutaten zur Einkaufsliste hinzugefügt`)}
function exportBackup(){const blob=new Blob([JSON.stringify({version:'0.8.0-rc.1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`fami-backup-${isoDate(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Sicherung heruntergeladen – Anhänge sind nicht enthalten')}
async function importBackup(file){try{const data=JSON.parse(await file.text());if(!data.state?.tasks||!data.state?.events)throw new Error();localStorage.setItem('fami-state',JSON.stringify(data.state));toast('Sicherung importiert – App wird neu geladen');setTimeout(()=>location.reload(),800)}catch{toast('Diese Sicherungsdatei ist ungültig')}}
async function renderFileLibrary(){
  const host=$('#fileLibrary');if(!host)return;const files=await getAllAttachments();host.innerHTML='';files.forEach(file=>{const card=document.createElement('article');card.className='library-file';card.innerHTML=`<span class="file-kind">${file.type?.startsWith('image/')?'FOTO':'DATEI'}</span><strong></strong><small></small><div><button class="open-library-file">Öffnen</button><button class="delete-library-file">Löschen</button></div>`;$('strong',card).textContent=file.name;$('small',card).textContent=`${Math.max(1,Math.round(file.size/1024))} KB · ${file.entity.startsWith('task:')?'Aufgabe':file.entity.startsWith('event:')?'Termin':'Allgemein'}`;$('.open-library-file',card).onclick=()=>{const url=URL.createObjectURL(file.blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('.delete-library-file',card).onclick=async()=>{await removeAttachment(file.id);renderFileLibrary();toast('Datei gelöscht')};host.append(card)});if(!files.length)host.innerHTML='<div class="task-empty">Noch keine Dateien gespeichert.</div>';
}

const views={
  calendar:{eyebrow:'GEMEINSAMER ÜBERBLICK',title:'Familienkalender',desc:'Alle Termine, farblich nach Person – ohne versteckte Einträge.',features:[['Persönliche Filter','Zeige alle oder nur deine eigenen Termine.'],['Sicher synchronisiert','Jede Änderung erscheint im Aktivitätsverlauf.'],['Wiederholungen','Schule, Sport und Routinen einmalig planen.']]},
  files:{eyebrow:'ALLES WICHTIGE',title:'Fotos & Dateien',desc:'Erinnerungen und Dokumente sicher mit der Familie teilen.',features:[['Gemeinsame Alben','Fotos sammeln, kommentieren und wiederfinden.'],['Dokumentenablage','Stundenpläne, Briefe und PDFs griffbereit.'],['Klare Rechte','Festlegen, wer ansehen, ergänzen oder löschen darf.']]}
};
function activitySectionMarkup(){
  const profile=state.familyProfile;
  return `<section class="calendar-discovery"><div class="discovery-heading"><p class="eyebrow">GEMEINSAM ETWAS ERLEBEN</p><h2>Aktivitäten entdecken</h2><p>Ideen passend zu eurem Ort und dem Alter der Kinder.</p></div><section class="discovery-settings"><label>Ort oder PLZ<input id="activityLocation" value="${profile.location}"></label><label>Emma – Alter<input id="emmaAge" type="number" min="0" max="17" value="${profile.emmaAge}"></label><label>Noah – Alter<input id="noahAge" type="number" min="0" max="17" value="${profile.noahAge}"></label><button class="btn primary" id="refreshIdeas">Vorschläge aktualisieren</button></section><div class="demo-note"><strong>Beispielvorschläge</strong><span>Live-Veranstaltungen und genaue Entfernungen werden in einer späteren Online-Version angebunden.</span></div><section class="activity-grid">${activityIdeas.map(item=>`<article class="activity-card"><span class="activity-emoji">${item.icon}</span><div class="activity-meta"><span>${item.category}</span><span>${item.distance}</span></div><h2>${item.title}</h2><p>${item.text}</p><div class="activity-bottom"><span>${item.when}</span><small>${item.ages}</small></div><button class="add-activity">Zum Kalender hinzufügen</button></article>`).join('')}</section></section>`;
}
function bindActivitySection(root){
  $('#refreshIdeas',root).onclick=()=>{state.familyProfile={location:$('#activityLocation',root).value.trim()||'Berlin',emmaAge:Number($('#emmaAge',root).value),noahAge:Number($('#noahAge',root).value)};save();toast('Familienprofil und Vorschläge aktualisiert')};
  $$('.add-activity',root).forEach((button,index)=>button.onclick=()=>{const idea=activityIdeas[index];state.events.push({id:`event-${Date.now()}-${index}`,title:idea.title,date:'',time:'11:00',place:`${idea.distance} · ${state.familyProfile.location}`,people:[...family],color:'green'});save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();toast('Aktivität zum Familienkalender hinzugefügt')});
}
function switchView(name){
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='home'){$('#homeView').classList.remove('hidden');$('#genericView').classList.add('hidden');return}
  $('#homeView').classList.add('hidden');const box=$('#genericView');box.classList.remove('hidden');
  if(name==='tasks'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">KLAR VERTEILT</p><h1>Aufgaben</h1><p>Alle Aufgaben bearbeiten, neu verteilen oder als erledigt markieren.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neue Aufgabe</span></button></div>${peoplePicker('task')}<section class="empty-shell"><div class="task-tools"><div class="task-filters"><button class="active" data-filter="open">Offen</button><button data-filter="done">Erledigt</button><button data-filter="all">Alle</button></div><p id="managerCount"></p></div><div class="task-manager" id="managedTasks"></div></section>`;
    $('.sub-add',box).onclick=()=>openModal('task');$$('[data-filter]',box).forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$('[data-filter]',box).forEach(x=>x.classList.toggle('active',x===b));renderTaskManager()});bindPeoplePicker(box,'task');renderTaskManager();return;
  }
  if(name==='shopping'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">GEMEINSAM EINKAUFEN</p><h1>Einkaufsliste</h1><p>Zutaten und Einkäufe an einem Ort – nach Bereichen sortiert.</p></div></div><form class="shopping-add" id="shoppingForm"><input id="shoppingName" required placeholder="Was wird benötigt?"><input id="shoppingQuantity" placeholder="Menge, z. B. 2 Stück"><button class="btn primary">Hinzufügen</button></form><div class="shopping-actions"><span id="shoppingSummary"></span><button id="clearBought">Erledigte entfernen</button></div><div class="shopping-list" id="shoppingList"></div>`;
    $('#shoppingForm').onsubmit=e=>{e.preventDefault();addShoppingItem($('#shoppingName').value.trim(),$('#shoppingQuantity').value.trim()||'1');e.target.reset();renderShoppingList();toast('Zur Einkaufsliste hinzugefügt')};$('#clearBought').onclick=()=>{state.shoppingItems=state.shoppingItems.filter(item=>!item.done);save();renderShoppingList();updateShoppingCount();toast('Erledigte Einkäufe entfernt')};renderShoppingList();return;
  }
  if(name==='recipes'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">EINFACH GUT ESSEN</p><h1>Rezepte</h1><p>Proteinreiche Ideen von Schmale Schulter – kompakt für euren Familienalltag.</p></div></div><div class="recipe-source-note">Inspiriert von öffentlich zugänglichen Videos von <strong>Schmale Schulter</strong>. Für die vollständige Zubereitung führt jedes Rezept zum Originalvideo.</div><section class="recipe-grid">${recipes.map(recipe=>`<article class="recipe-card"><span class="recipe-emoji">${recipe.emoji}</span><div class="recipe-tags">${recipe.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><h2>${recipe.title}</h2><p>${recipe.time} · ${recipe.portions}</p><details><summary>${recipe.ingredients.length} Zutaten anzeigen</summary><ul>${recipe.ingredients.map(([name,quantity])=>`<li><span>${name}</span><strong>${quantity}</strong></li>`).join('')}</ul></details><button class="btn primary recipe-add" data-recipe="${recipe.id}"><svg><use href="#i-cart"/></svg>Alles zur Einkaufsliste</button><a href="${recipe.url}" target="_blank" rel="noopener">Originalvideo ansehen ↗</a></article>`).join('')}</section>`;
    $$('.recipe-add',box).forEach(button=>button.onclick=()=>addRecipeToShopping(recipes.find(recipe=>recipe.id===button.dataset.recipe)));return;
  }
  if(name==='files'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">ALLES WICHTIGE</p><h1>Fotos & Dateien</h1><p>Alle lokal gespeicherten Anhänge aus Aufgaben und Terminen.</p></div><label class="btn primary library-upload"><svg><use href="#i-upload"/></svg><span>Dateien hinzufügen</span><input type="file" id="libraryUploadInput" multiple></label></div><section class="file-library" id="fileLibrary"></section>`;$('#libraryUploadInput').onchange=async e=>{await storeAttachments('general:shared',e.target.files);e.target.value='';renderFileLibrary();toast('Dateien lokal gespeichert')};renderFileLibrary();return;
  }
  if(name==='more'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">WEITERE BEREICHE</p><h1>Mehr</h1><p>Alles Weitere für euren Familienalltag.</p></div></div><section class="more-grid"><button data-jump="shopping"><svg><use href="#i-cart"/></svg><strong>Einkaufsliste</strong><span>${state.shoppingItems.filter(item=>!item.done).length} offene Einträge</span></button><button data-jump="recipes"><svg><use href="#i-book"/></svg><strong>Rezepte</strong><span>Ideen & Zutaten</span></button><button data-jump="files"><svg><use href="#i-folder"/></svg><strong>Dateien</strong><span>Fotos & Dokumente</span></button></section><section class="backup-panel"><div><strong>Lokale Datensicherung</strong><span>Aufgaben, Termine, Filter und Einkaufsliste sichern. Anhänge sind nicht enthalten.</span></div><button class="btn ghost" id="exportBackup">Sicherung herunterladen</button><label class="btn ghost">Sicherung importieren<input type="file" id="importBackup" accept="application/json"></label></section>`;$$('[data-jump]',box).forEach(button=>button.onclick=()=>switchView(button.dataset.jump));$('#exportBackup').onclick=exportBackup;$('#importBackup').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0])};return;
  }
  if(name==='calendar'){
    box.innerHTML=`<div class="subview-head calendar-head"><div><p class="eyebrow">GEMEINSAMER ÜBERBLICK</p><h1>Familienkalender</h1><p>Monatsübersicht für eure Termine, Feiertage und Schulferien.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neuer Termin</span></button></div><section class="month-shell"><div class="month-toolbar"><button id="prevMonth">‹</button><h2 id="monthTitle"></h2><button id="nextMonth">›</button><button id="todayMonth">Heute</button></div><div class="month-calendar" id="monthCalendar"></div></section><details class="calendar-options"><summary>Ansicht, Feiertage & Ferien auswählen</summary><div class="calendar-options-body">${peoplePicker('calendar')}<section class="holiday-controls"><label>Bundesland<select id="holidayRegion">${Object.entries(subdivisions).map(([code,name])=>`<option value="${code}" ${code===state.holidaySettings.subdivision?'selected':''}>${name}</option>`).join('')}</select></label><label class="calendar-toggle"><input id="showPublic" type="checkbox" ${state.holidaySettings.showPublic?'checked':''}><span></span>Feiertage</label><label class="calendar-toggle"><input id="showSchool" type="checkbox" ${state.holidaySettings.showSchool?'checked':''}><span></span>Schulferien</label><small id="holidayStatus">Daten passend zum gewählten Bundesland</small></section></div></details><h2 class="list-heading">Terminliste</h2><section class="empty-shell calendar-list-shell"><div class="calendar-manager" id="calendarEntries"></div></section>${activitySectionMarkup()}`;
    $('.sub-add',box).onclick=()=>openModal('event');bindPeoplePicker(box,'calendar');renderCalendarManager();renderMonthCalendar();loadHolidayData();
    $('#prevMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderMonthCalendar();loadHolidayData()};$('#nextMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderMonthCalendar();loadHolidayData()};$('#todayMonth').onclick=()=>{calendarCursor=new Date(today.getFullYear(),today.getMonth(),1);renderMonthCalendar();loadHolidayData()};
    $('#holidayRegion').onchange=e=>{state.holidaySettings.subdivision=e.target.value;save();loadHolidayData()};$('#showPublic').onchange=e=>{state.holidaySettings.showPublic=e.target.checked;save();renderMonthCalendar()};$('#showSchool').onchange=e=>{state.holidaySettings.showSchool=e.target.checked;save();renderMonthCalendar()};bindActivitySection(box);return;
  }
  const v=views[name];box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">${v.eyebrow}</p><h1>${v.title}</h1><p>${v.desc}</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neu erstellen</span></button></div><section class="empty-shell"><div class="feature-grid">${v.features.map(x=>`<article class="feature-item"><strong>${x[0]}</strong><p>${x[1]}</p></article>`).join('')}</div></section>`;$('.sub-add',box).onclick=()=>openModal(name==='calendar'?'event':'note');
}
$$('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));$$('.nav-link').forEach(b=>b.onclick=()=>switchView(b.dataset.target));
$('#globalSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('.event,.task,.file-tile').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'':'none')});

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('#installApp').classList.remove('hidden')});
$('#installApp').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')toast('Fami wird installiert');installPrompt=null;$('#installApp').classList.add('hidden')};
window.addEventListener('appinstalled',()=>toast('Fami ist jetzt auf deinem Gerät'));
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));

renderHomeTasks();applyHomeCalendarFilter();updateShoppingCount();save();
