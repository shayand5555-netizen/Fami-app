const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const defaults = [
  {id:'base-1',title:'Pfand wegbringen',person:'Tom',dateLabel:'Heute',date:'',note:'',done:false},
  {id:'base-2',title:'Elternbrief unterschreiben',person:'Lena',dateLabel:'Heute · wichtig',date:'',note:'Bitte morgen wieder in die Schultasche legen.',done:false},
  {id:'base-3',title:'Spülmaschine ausräumen',person:'Emma',dateLabel:'Heute',date:'',note:'',done:false},
  {id:'base-4',title:'Geburtstagsgeschenk bestellen',person:'Tom',dateLabel:'Morgen',date:'',note:'',done:false},
  {id:'base-5',title:'Pflanzen gießen',person:'Noah',dateLabel:'Freitag · wiederholt sich',date:'',note:'',done:false}
];
let family = ['Lena','Tom','Emma','Noah'];
const defaultEvents = [
  {id:'event-1',date:'',time:'08:00',title:'Zahnarzt Emma',place:'Praxis Dr. König · Prenzlauer Berg',people:['Emma'],color:'blue'},
  {id:'event-2',date:'',time:'10:30',title:'Wocheneinkauf',place:'Markthalle · Liste ist geteilt',people:['Lena','Tom'],color:'coral'},
  {id:'event-3',date:'',time:'15:30',title:'Fußballtraining Noah',place:'Sportplatz Nord',people:['Noah'],color:'yellow'},
  {id:'event-4',date:'',time:'18:30',title:'Gemeinsames Abendessen',place:'Zuhause · Lasagne',people:['Lena','Tom','Emma','Noah'],color:'green'}
];
const fallbackActivityIdeas = [
  {icon:'🎃',title:'Kürbisfest & Herbstmarkt',category:'Feste',ages:'3–14 Jahre',distance:'ca. 12 km',when:'Dieses Wochenende',text:'Kürbisschnitzen, Strohburg und regionale Leckereien.'},
  {icon:'🦕',title:'Familientag im Museum',category:'Drinnen',ages:'5–16 Jahre',distance:'ca. 4 km',when:'Sonntag',text:'Mitmachstationen und eine kindgerechte Entdeckungstour.'},
  {icon:'🌲',title:'Wald-Rallye für Familien',category:'Draußen',ages:'4–12 Jahre',distance:'ca. 8 km',when:'Nächsten Samstag',text:'Gemeinsam Spuren suchen und kleine Naturaufgaben lösen.'},
  {icon:'🎭',title:'Kinder- und Jugendtheater',category:'Kultur',ages:'6–15 Jahre',distance:'ca. 6 km',when:'In 9 Tagen',text:'Familienvorstellung am Nachmittag mit anschließendem Gespräch.'}
];
let discoveredActivityIdeas = [...fallbackActivityIdeas];
let activitySource = 'Regionale Familienangebote – Quelle: Hannover.de';
const recipes = [
  {id:'protein-reis',emoji:'🍚',image:'https://i.ytimg.com/vi/cc2hsZIiNts/hqdefault.jpg',title:'Knuspriger High-Protein-Reis',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=cc2hsZIiNts',time:'45 Min.',portions:'Meal Prep · 3 Tage',tags:['High Protein','Meal Prep'],nutrition:{kcal:690,protein:58,carbs:77,fat:14,label:'pro Portion',estimated:true,note:'Annahme: 600 g gekochter Reis, 3 Portionen und 10 g Öl.'},ingredients:[['Reis','600 g'],['Hähnchen','600 g'],['Möhren','5 Stück'],['Lauchzwiebeln','1 Bund'],['Gurke','1 Stück'],['Grüner Salat','1 Kopf'],['Knoblauch','1 Zehe'],['Erdnussbutter','2 EL'],['Sojasauce','100 ml'],['Essig','1 TL'],['Mandelmilch','1 Schuss'],['Honig','1 TL'],['Olivenöl','etwas']]},
  {id:'teriyaki-bowl',emoji:'🥗',image:'https://i.ytimg.com/vi/fN6bewxD94o/hqdefault.jpg',title:'Teriyaki-Hähnchen-Bowl',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=fN6bewxD94o',time:'40 Min.',portions:'3–4 Portionen',tags:['Proteinreich','Familientauglich'],nutrition:{kcal:490,protein:34,carbs:72,fat:4,label:'pro Portion',estimated:true,note:'Annahme: 4 Portionen und eine übliche Teriyaki-Sauce.'},ingredients:[['Tomaten','3 Stück'],['Zwiebel','1 Stück'],['Knoblauch','3 Zehen'],['Paprika','1 Stück'],['Peperoni','1 Stück'],['Petersilie','1 Bund'],['Limette','1 Stück'],['Reis','300 g'],['Hähnchen','500 g'],['Teriyaki-Sauce','100 ml'],['Eisbergsalat','1 Kopf']]},
  {id:'granola',emoji:'🥣',image:'https://i.ytimg.com/vi/fN6bewxD94o/hqdefault.jpg',title:'Protein-Frühstück mit Granola',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=fN6bewxD94o',time:'25 Min.',portions:'Mehrere Frühstücke',tags:['Frühstück','Vorbereiten'],nutrition:{kcal:500,protein:33,carbs:64,fat:13,label:'pro Frühstück',estimated:true,note:'Annahme: 50 g Granola, 250 g Skyr und ein halber Apfel.'},ingredients:[['Haferflocken','200 g'],['Honig','120 g'],['Erdnussbutter','30 g'],['Walnusskerne','30 g'],['Mandelsplitter','30 g'],['Haselnüsse','30 g'],['Kürbiskerne','30 g'],['Sesam','etwas'],['Skyr oder Quark','nach Bedarf'],['Äpfel','3 Stück']]},
  {id:'tandoori-mealprep',emoji:'🍛',image:'https://i.ytimg.com/vi/he_4Lm0rkdg/hqdefault.jpg',title:'Tandoori-Hähnchen Meal Prep',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=he_4Lm0rkdg',time:'15 Min.',portions:'3 Portionen',tags:['High Protein','Meal Prep'],nutrition:{kcal:735,protein:60,carbs:94,fat:9.5,label:'pro Portion'},ingredients:[['Reis','300 g'],['Hähnchenbrust','600 g'],['Stückige Tomaten','800 g'],['Zitrone','½ Stück'],['Joghurt','2 EL'],['Knoblauch','2 Zehen'],['Ingwer','nach Geschmack'],['Kochsahne 7 %','250 ml'],['Tandoori-Masala-Paste','2 TL'],['Zwiebel','1 groß']]},
  {id:'bacon-egg-breakfast',emoji:'🍳',image:'https://i.ytimg.com/vi/SWjPFXJZq_8/hqdefault.jpg',title:'Bacon-Ei-Frühstück',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=SWjPFXJZq_8',time:'Schnell',portions:'1 Portion',tags:['Low Carb','Frühstück'],nutrition:{kcal:596,protein:39,carbs:6,fat:47,label:'pro Portion'},ingredients:[['Eisbergsalat','100 g'],['Eier','3 Stück'],['Zwiebel','½ Stück'],['Bacon','2 Streifen'],['Butter','10 g'],['Cheddar','50 g'],['Cherrytomaten','50 g']]},
  {id:'burger-bowl',emoji:'🥘',image:'https://i.ytimg.com/vi/SWjPFXJZq_8/hqdefault.jpg',title:'Low-Carb Burger Bowl',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=SWjPFXJZq_8',time:'Schnell',portions:'1 Portion',tags:['High Protein','Low Carb'],nutrition:{kcal:667,protein:66,carbs:17,fat:36,label:'pro Portion'},ingredients:[['Blumenkohl','300 g'],['Mageres Rinderhack','200 g'],['Eisbergsalat','20 g'],['Ei','1 Stück'],['Cherrytomaten','100 g'],['Cheddar','30 g'],['Bacon','2 Streifen'],['Käsesauce','10 g'],['Röstzwiebeln','5 g'],['Senf','1 TL'],['Paniermehl','1 TL']]},
  {id:'protein-brownie',emoji:'🍫',image:'https://i.ytimg.com/vi/SWjPFXJZq_8/hqdefault.jpg',title:'Low-Carb Schoko-Brownie',source:'Schmale Schulter',url:'https://www.youtube.com/watch?v=SWjPFXJZq_8',time:'Dessert',portions:'10 Stücke',tags:['Dessert','Low Carb'],nutrition:{kcal:312,protein:10,carbs:7,fat:27,label:'pro Stück'},ingredients:[['Eier','4 Stück'],['Erythrit','190 g'],['Dunkle Schokolade','100 g'],['Vanilleextrakt zuckerfrei','½ TL'],['Butter','240 g'],['Mandelmehl','100 g'],['Backpulver','1 Packung']]}
];
const recipeInstructions = {
  'protein-reis':['Reis garen und vollständig ausdampfen lassen.','Hähnchen und Gemüse klein schneiden und kräftig anbraten.','Erdnussbutter, Sojasauce, Essig, Mandelmilch und Honig verrühren. Alles mischen und den Reis knusprig braten.'],
  'teriyaki-bowl':['Reis nach Packungsangabe kochen.','Hähnchen und Gemüse klein schneiden und nacheinander anbraten.','Teriyaki-Sauce zugeben, kurz einkochen und mit Salat und Reis als Bowl anrichten.'],
  'granola':['Haferflocken, Nüsse und Kerne vermengen.','Honig und Erdnussbutter erwärmen, untermischen und die Mischung goldbraun backen.','Abkühlen lassen und mit Skyr oder Quark und Apfel servieren.'],
  'tandoori-mealprep':['Reis kochen und auf drei Portionen verteilen.','Hähnchen mit Joghurt und Tandoori-Paste marinieren und anbraten.','Zwiebel, Knoblauch, Tomaten und Kochsahne zugeben, köcheln lassen und mit dem Reis portionieren.'],
  'bacon-egg-breakfast':['Bacon knusprig braten und beiseitestellen.','Zwiebel und Eier in Butter garen.','Mit Salat, Tomaten, Cheddar und Bacon anrichten.'],
  'burger-bowl':['Blumenkohl garen und als Basis in eine Schüssel geben.','Hackfleisch und Bacon braten, das Ei nach Wunsch garen.','Mit Salat, Tomaten, Cheddar, Sauce und Röstzwiebeln zur Bowl zusammensetzen.'],
  'protein-brownie':['Schokolade und Butter vorsichtig schmelzen.','Eier mit Erythrit verrühren, anschließend die Schokoladenmischung einarbeiten.','Mandelmehl und Backpulver unterheben, in eine Form geben und backen, bis die Mitte gerade fest ist.']
};
const stored = JSON.parse(localStorage.getItem('fami-state') || '{}');
if(Array.isArray(stored.familyMembers)&&stored.familyMembers.length)family=stored.familyMembers.filter(Boolean);
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
  familyProfile: stored.familyProfile || {location:'Hannover-Misburg',emmaAge:10,noahAge:7},
  holidaySettings: stored.holidaySettings || {subdivision:'DE-NI',showPublic:true,showSchool:true},
  shoppingItems: stored.shoppingItems || [],
  customRecipes: Array.isArray(stored.customRecipes) ? stored.customRecipes : [],
  watchedRecipes: Array.isArray(stored.watchedRecipes) ? stored.watchedRecipes : [],
  recipeSort: stored.recipeSort || 'unwatched',
  watchedVideos: Array.isArray(stored.watchedVideos) ? stored.watchedVideos : [],
  videoSort: stored.videoSort || 'newest',
  videoChannel: stored.videoChannel || 'all',
  videoMeal: stored.videoMeal || 'all',
  videoCuisine: stored.videoCuisine || 'all',
  familyMembers:[...family],
  familyName:stored.familyName || 'Familie Weber',
  currentUser:stored.currentUser && family.includes(stored.currentUser) ? stored.currentUser : family[0],
  memberAges:stored.memberAges || {Emma:stored.familyProfile?.emmaAge??10,Noah:stored.familyProfile?.noahAge??7}
};
state.tasks = state.tasks.filter(task => !state.deletedIds.includes(task.id));

let createType = 'task';
let taskFilter = 'open';
let currentView = 'home';
let installPrompt = null;
const today = new Date();
let calendarCursor = new Date(today.getFullYear(),today.getMonth(),1);
let holidayData = {public:[],school:[]};
const subdivisions = {'DE-BW':'Baden-Württemberg','DE-BY':'Bayern','DE-BE':'Berlin','DE-BB':'Brandenburg','DE-HB':'Bremen','DE-HH':'Hamburg','DE-HE':'Hessen','DE-MV':'Mecklenburg-Vorpommern','DE-NI':'Niedersachsen','DE-NW':'Nordrhein-Westfalen','DE-RP':'Rheinland-Pfalz','DE-SL':'Saarland','DE-SN':'Sachsen','DE-ST':'Sachsen-Anhalt','DE-SH':'Schleswig-Holstein','DE-TH':'Thüringen'};

$('#dateLabel').textContent = today.toLocaleDateString('de-DE', {weekday:'long',day:'2-digit',month:'long'}).toUpperCase();
$('#itemDate').valueAsDate = today;

function save(){ localStorage.setItem('fami-state', JSON.stringify(state)); window.FamiCloud?.schedulePush(state); }
function toast(message){ const t=$('#toast'); $('p',t).textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2400); }
function initials(person){ return person === 'Alle' ? 'A' : person.charAt(0); }
function avatarClass(person){const classes=['lena','tom','emma','noah'];const index=Math.max(0,family.indexOf(person));return classes[index%classes.length]}
function prettyDate(raw, fallback='Heute'){
  return raw ? new Date(`${raw}T12:00`).toLocaleDateString('de-DE',{day:'2-digit',month:'short'}) : fallback;
}
function getTask(id){ return state.tasks.find(task => task.id === id); }
function isVisible(person, kind='task'){ return state[kind==='task'?'taskPeople':'calendarPeople'].includes(person) || person === 'Alle'; }

function openFileDb(){
  return new Promise((resolve,reject)=>{const request=indexedDB.open('fami-files',1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('attachments')){const store=db.createObjectStore('attachments',{keyPath:'id'});store.createIndex('entity','entity')}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
}
async function storeAttachments(entity,files){
  if(!files?.length)return;
  if(window.FamiCloud?.isConnected()){
    try{await window.FamiCloud.uploadFiles(entity,[...files]);return}
    catch(error){console.error(error);toast('Cloud-Upload fehlgeschlagen – Datei wird lokal gespeichert')}
  }
  const db=await openFileDb();const tx=db.transaction('attachments','readwrite');const store=tx.objectStore('attachments');
  [...files].forEach(file=>store.put({id:`${entity}-${Date.now()}-${Math.random()}`,entity,name:file.name,type:file.type,size:file.size,blob:file}));
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
}
async function getAttachments(entity){
  const db=await openFileDb();const tx=db.transaction('attachments','readonly');const req=tx.objectStore('attachments').index('entity').getAll(entity);const local=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();if(!window.FamiCloud?.isConnected())return local;try{const cloud=await window.FamiCloud.listFiles(entity);return [...local,...cloud.filter(file=>!local.some(item=>item.entity===file.entity&&item.name===file.name&&item.size===file.size))]}catch(error){console.error(error);return local}
}
async function getAllAttachments(){const db=await openFileDb();const tx=db.transaction('attachments','readonly');const req=tx.objectStore('attachments').getAll();const local=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();if(!window.FamiCloud?.isConnected())return local;try{const cloud=await window.FamiCloud.listFiles();return [...local,...cloud.filter(file=>!local.some(item=>item.entity===file.entity&&item.name===file.name&&item.size===file.size))]}catch(error){console.error(error);return local}}
async function removeAttachment(fileOrId){const id=typeof fileOrId==='string'?fileOrId:fileOrId.id;if(id.startsWith('cloud:')){await window.FamiCloud.deleteFile(id);return}const db=await openFileDb();const tx=db.transaction('attachments','readwrite');tx.objectStore('attachments').delete(id);await new Promise(resolve=>tx.oncomplete=resolve);db.close()}
async function removeEntityAttachments(entity){const files=await getAttachments(entity);await Promise.all(files.map(file=>removeAttachment(file)))}
async function renderAttachments(entity,host){
  const files=await getAttachments(entity);host.innerHTML='';files.forEach(file=>{const row=document.createElement('div');row.className='attachment';row.innerHTML='<button class="attachment-open"></button><small></small><button class="attachment-delete" aria-label="Anhang löschen">×</button>';$('.attachment-open',row).textContent=file.name;$('small',row).textContent=`${Math.max(1,Math.round(file.size/1024))} KB`;$('.attachment-open',row).onclick=()=>{const url=URL.createObjectURL(file.blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('.attachment-delete',row).onclick=async()=>{await removeAttachment(file);renderAttachments(entity,host);toast('Anhang gelöscht')};host.append(row)});
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
  return `<div class="people-filter"><span>Anzeigen für</span><div>${family.map(person=>`<button class="person-chip ${selected.includes(person)?'active':''}" data-person="${escapeHtml(person)}" data-kind="${kind}"><span class="avatar ${avatarClass(person)} mini">${initials(person)}</span>${person===state.currentUser?'Ich':escapeHtml(person)}</button>`).join('')}</div><small>Du kannst als Elternteil die Aufgaben und Termine der Kinder zusätzlich einblenden.</small></div>`;
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
function icsEscape(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function icsUnescape(value){return String(value||'').replace(/\\n/gi,'\n').replace(/\\([\\,;])/g,'$1')}
function icsStamp(date=new Date()){return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}
function localIcsDate(date,time='12:00'){return `${date.replaceAll('-','')}T${time.replace(':','')}00`}
function exportCalendarIcs(){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fami//Familienkalender//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Fami Familienkalender'];
  [...state.events].sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).forEach(event=>{const start=new Date(`${event.date}T${event.time||'12:00'}:00`);const end=new Date(start.getTime()+60*60*1000);lines.push('BEGIN:VEVENT',`UID:${icsEscape(event.id)}@fami`,`DTSTAMP:${icsStamp()}`,`DTSTART:${localIcsDate(event.date,event.time||'12:00')}`,`DTEND:${localIcsDate(isoDate(end),`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`)}`,`SUMMARY:${icsEscape(event.title)}`,`LOCATION:${icsEscape(event.place||'')}`,`DESCRIPTION:${icsEscape(`Zugeordnet: ${(event.people||[]).join(', ')}`)}`,`X-FAMI-PEOPLE:${icsEscape((event.people||[]).join(','))}`,'END:VEVENT')});
  lines.push('END:VCALENDAR');const blob=new Blob([`${lines.join('\r\n')}\r\n`],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`fami-kalender-${isoDate(new Date())}.ics`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`${state.events.length} Termine exportiert`);
}
function parseIcsDate(value){
  const clean=String(value||'').trim();if(!/^\d{8}/.test(clean))return null;
  if(clean.endsWith('Z')){const date=new Date(`${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T${clean.slice(9,11)||'00'}:${clean.slice(11,13)||'00'}:${clean.slice(13,15)||'00'}Z`);return {date:isoDate(date),time:`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}}
  return {date:`${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`,time:clean.includes('T')?`${clean.slice(9,11)}:${clean.slice(11,13)}`:'12:00'};
}
function expandIcsRecurrence(base,rule){
  if(!rule)return [base];const settings=Object.fromEntries(rule.split(';').map(part=>part.split('=')));const interval=Math.max(1,Number(settings.INTERVAL)||1);const count=Math.min(500,Number(settings.COUNT)||500);const until=parseIcsDate(settings.UNTIL)?.date;const start=new Date(`${base.date}T12:00:00`);const cap=new Date(start);cap.setFullYear(cap.getFullYear()+2);const end=until?new Date(`${until}T23:59:59`):cap;const results=[];const add=date=>{if(date<start||date>end||results.length>=count)return;results.push({...base,date:isoDate(date)})};
  if(settings.FREQ==='WEEKLY'&&settings.BYDAY){const days=settings.BYDAY.split(',').map(day=>({SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6})[day.slice(-2)]).filter(day=>day!==undefined);for(let date=new Date(start);date<=end&&results.length<count;date.setDate(date.getDate()+1)){const week=Math.floor((date-start)/(7*86400000));if(week%interval===0&&days.includes(date.getDay()))add(new Date(date))}return results}
  for(let index=0,date=new Date(start);date<=end&&results.length<count;index++){add(new Date(date));if(settings.FREQ==='DAILY')date.setDate(date.getDate()+interval);else if(settings.FREQ==='WEEKLY')date.setDate(date.getDate()+7*interval);else if(settings.FREQ==='MONTHLY')date.setMonth(date.getMonth()+interval);else if(settings.FREQ==='YEARLY')date.setFullYear(date.getFullYear()+interval);else break}return results;
}
async function importCalendarIcs(file){
  try{const text=await file.text();const unfolded=text.replace(/\r?\n[ \t]/g,'');const blocks=unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi)||[];let added=0,duplicates=0;for(const block of blocks){const fields={};block.split(/\r?\n/).forEach(line=>{const split=line.indexOf(':');if(split<0)return;const key=line.slice(0,split).split(';')[0].toUpperCase();if(fields[key]===undefined)fields[key]=line.slice(split+1)});const start=parseIcsDate(fields.DTSTART);if(!start)continue;const people=(fields['X-FAMI-PEOPLE']?icsUnescape(fields['X-FAMI-PEOPLE']).split(','):family).filter(name=>family.includes(name));const base={title:icsUnescape(fields.SUMMARY)||'Importierter Termin',date:start.date,time:start.time,place:icsUnescape(fields.LOCATION||fields.DESCRIPTION||''),people:people.length?people:[...family],color:'blue'};for(const item of expandIcsRecurrence(base,fields.RRULE)){if(state.events.some(event=>event.title===item.title&&event.date===item.date&&event.time===item.time)){duplicates++;continue}state.events.push({...item,id:`event-import-${Date.now()}-${added}-${Math.random().toString(36).slice(2,7)}`});added++}}
    if(!blocks.length)throw new Error('Keine Termine');save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();toast(`${added} Termine importiert${duplicates?` · ${duplicates} Duplikate übersprungen`:''}`)
  }catch(error){console.error(error);toast('Die Kalenderdatei konnte nicht importiert werden')}
}
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

$('#fileInput').addEventListener('change',async e=>{if(e.target.files.length){await storeAttachments('general:shared',e.target.files);toast(`${e.target.files.length} ${e.target.files.length===1?'Datei wurde':'Dateien wurden'} gespeichert`);e.target.value=''}});$('#inviteBtn').onclick=()=>window.FamiCloud?.openSetup();

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
function allRecipes(){const items=[...state.customRecipes,...recipes];if(state.recipeSort==='default')return items;return items.sort((a,b)=>{const first=state.watchedRecipes.includes(a.id)?1:0;const second=state.watchedRecipes.includes(b.id)?1:0;return state.recipeSort==='watched'?second-first:first-second})}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function refreshPersonSelects(){
  ['#itemPerson','#editTaskPerson','#editEventPerson'].forEach(selector=>{const select=$(selector);if(!select)return;const previous=select.value;select.replaceChildren(...[...family,'Alle'].map(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;return option}));select.value=[...family,'Alle'].includes(previous)?previous:family[0]});
}
function syncFamilyUi(){
  $('#familyNameLabel').textContent=(state.familyName||'Deine Familie').toUpperCase();
  $('#familySyncLabel').textContent=window.FamiCloud?.isConnected()?`${family.length} Mitglieder · live synchronisiert`:`${family.length} Mitglieder · Online-Modus optional`;
  const current=state.currentUser||family[0];$('#welcomeName').textContent=current;$('#profileName').textContent=current;$('#profileInitial').textContent=initials(current);$('#profileInitial').className=`avatar ${avatarClass(current)}`;
  const stack=$('#familySettingsBtn');stack.replaceChildren(...family.slice(0,5).map(name=>{const span=document.createElement('span');span.className=`avatar ${avatarClass(name)}`;span.textContent=initials(name);span.title=name;return span}));refreshPersonSelects();
}
function familyMemberRow(name='',index=family.length){return `<div class="family-member-row" data-old-name="${escapeHtml(name)}"><span class="avatar ${avatarClass(name||family[index%family.length]||'')} mini">${name?initials(name):'+'}</span><input class="family-member-name" required maxlength="30" value="${escapeHtml(name)}" placeholder="Name"><label>Alter (optional)<input class="family-member-age" type="number" min="0" max="120" value="${name&&state.memberAges[name]!==undefined?state.memberAges[name]:''}"></label><button type="button" class="remove-family-member" aria-label="Mitglied entfernen">×</button></div>`}
function bindRemoveMembers(root){$$('.remove-family-member',root).forEach(button=>button.onclick=()=>{if($$('.family-member-row',root).length<=1)return toast('Mindestens ein Mitglied behalten');button.closest('.family-member-row').remove()})}
function bindFamilySettings(root){
  const list=$('#familyMemberList',root);$('#addFamilyMember',root).onclick=()=>{if($$('.family-member-row',list).length>=10)return toast('Maximal 10 Familienprofile');list.insertAdjacentHTML('beforeend',familyMemberRow());bindRemoveMembers(list)};bindRemoveMembers(list);
  $('#familySettingsForm',root).onsubmit=e=>{e.preventDefault();const rows=$$('.family-member-row',list);const names=rows.map(row=>$('.family-member-name',row).value.trim()).filter(Boolean);if(!names.length)return toast('Mindestens ein Familienmitglied ist erforderlich');if(new Set(names.map(name=>name.toLowerCase())).size!==names.length)return toast('Jeder Name darf nur einmal vorkommen');const fallback=names[0];const rename={};rows.forEach((row,index)=>{const old=row.dataset.oldName;if(old)rename[old]=names[index]||fallback});state.tasks.forEach(task=>task.person=rename[task.person]||(!names.includes(task.person)?fallback:task.person));state.events.forEach(event=>event.people=[...new Set(event.people.map(person=>rename[person]||(!names.includes(person)?fallback:person)))]);state.taskPeople=[...new Set(state.taskPeople.map(person=>rename[person]||person).filter(person=>names.includes(person)))];state.calendarPeople=[...new Set(state.calendarPeople.map(person=>rename[person]||person).filter(person=>names.includes(person)))];const ages={};rows.forEach((row,index)=>{const age=$('.family-member-age',row).value;if(names[index]&&age!=='')ages[names[index]]=Number(age)});state.memberAges=ages;state.familyName=$('#editFamilyName',root).value.trim()||'Meine Familie';const selected=$('#editCurrentUser',root).value;state.currentUser=rename[selected]||names.find(name=>name===selected)||fallback;family=[...names];state.familyMembers=[...names];save();syncFamilyUi();switchView('family');toast('Familie aktualisiert')};
  root.insertAdjacentHTML('beforeend','<section class="family-invite-guide"><div><p class="eyebrow">TEST MIT EINER ZWEITEN PERSON</p><h2>Familienmitglied einladen</h2><p>Der Einladungscode verbindet beide Geräte mit denselben Terminen, Aufgaben, Einkaufslisten und Dateien.</p></div><ol><li>Falls nötig oben ein zusätzliches Familienprofil anlegen und speichern.</li><li>Auf „Einladung öffnen“ drücken und den vollständigen Einladungstext kopieren.</li><li>Die andere Person öffnet den Link auf ihrem eigenen Handy und meldet sich mit ihrer E-Mail-Adresse an.</li><li>Danach „Familie beitreten“ wählen und den achtstelligen Einladungscode eingeben.</li><li>Unter „Familie bearbeiten“ bei „Wer nutzt dieses Gerät?“ das passende Profil auswählen.</li></ol><p class="invite-warning">Wichtig: Der Code gewährt Zugriff auf eure gemeinsamen Familiendaten. Nur direkt an vertraute Personen senden.</p><button class="btn primary" id="openFamilyInvite">Einladung öffnen</button></section>');
  $('#openFamilyInvite',root).onclick=()=>window.FamiCloud?.openSetup();
}
function safeRecipeUrl(value){try{const url=new URL(value);return /^https?:$/.test(url.protocol)?url.href:''}catch{return''}}
function parseIngredients(value){return value.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const parts=line.split('|').map(part=>part.trim());return parts.length>1?[parts[0],parts.slice(1).join(' | ')]:[line,'nach Bedarf']})}
function recipeCard(recipe){
  const url=safeRecipeUrl(recipe.url);const link=url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Original bei ${escapeHtml(recipe.source||'der Quelle')} öffnen ↗</a>`:'';
  const remove=recipe.custom?`<button class="recipe-delete" data-delete-recipe="${recipe.id}">Rezept löschen</button>`:'';
  const visual=`<span class="recipe-emoji">${recipe.emoji||'🍲'}</span>${recipe.image?`<img src="${escapeHtml(recipe.image)}" alt="Vorschaubild zum Video ${escapeHtml(recipe.title)}" loading="lazy" referrerpolicy="no-referrer">`:''}`;
  const nutrition=recipe.nutrition?`<div class="nutrition-grid${recipe.nutrition.estimated?' estimated':''}" aria-label="Nährwerte ${escapeHtml(recipe.nutrition.label||'pro Portion')}"><small>${recipe.nutrition.estimated?'KI-Schätzung':'Originalwert'} · ${escapeHtml(recipe.nutrition.label||'pro Portion')}</small><span><strong>${recipe.nutrition.kcal}</strong> kcal</span><span><strong>${recipe.nutrition.protein}</strong> g Protein</span><span><strong>${recipe.nutrition.carbs}</strong> g KH</span><span><strong>${recipe.nutrition.fat}</strong> g Fett</span>${recipe.nutrition.note?`<em>${escapeHtml(recipe.nutrition.note)}</em>`:''}</div>`:`<p class="nutrition-missing">Nährwerte: ${escapeHtml(recipe.nutritionNote||'nicht angegeben')}</p>`;
  const watched=state.watchedRecipes.includes(recipe.id);
  const steps=recipe.steps?.length?recipe.steps:recipeInstructions[recipe.id]||[];const instructions=steps.length?`<details class="recipe-instructions"><summary>👩‍🍳 Kochanleitung</summary><ol>${steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol></details>`:url?`<a class="recipe-instruction-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">👩‍🍳 Kochanleitung ansehen</a>`:'<span class="recipe-instruction-missing">Keine Kochanleitung hinterlegt</span>';
  return `<article class="recipe-card${watched?' watched':''}"><div class="recipe-visual" data-recipe-image="${recipe.id}">${visual}<button class="recipe-watch" data-watch-recipe="${recipe.id}" aria-pressed="${watched}">${watched?'✓ Angesehen':'Als angesehen markieren'}</button></div><div class="recipe-tags">${(recipe.tags||['Eigenes Rezept']).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div><h2>${escapeHtml(recipe.title)}</h2><p>${escapeHtml(recipe.time||'Eigene Sammlung')}${recipe.portions?` · ${escapeHtml(recipe.portions)}`:''}</p>${nutrition}<details><summary>${recipe.ingredients.length} Zutaten anzeigen</summary><ul>${recipe.ingredients.map(([name,quantity])=>`<li><span>${escapeHtml(name)}</span><strong>${escapeHtml(quantity)}</strong></li>`).join('')}</ul></details>${instructions}<button class="btn primary recipe-add" data-recipe="${recipe.id}"><svg><use href="#i-cart"/></svg>Alles zur Einkaufsliste</button>${link}${remove}</article>`;
}
async function loadRecipeImages(root){for(const recipe of state.customRecipes.filter(item=>item.hasPhoto)){const host=$(`[data-recipe-image="${recipe.id}"]`,root);if(!host)continue;const files=await getAttachments(`recipe:${recipe.id}`);const photo=files.find(file=>file.type?.startsWith('image/'));if(!photo)continue;const url=URL.createObjectURL(photo.blob);const img=document.createElement('img');img.alt=`Foto von ${recipe.title}`;img.src=url;img.onload=()=>URL.revokeObjectURL(url);host.replaceChildren(img)}}
async function deleteRecipe(id){state.customRecipes=state.customRecipes.filter(recipe=>recipe.id!==id);await removeEntityAttachments(`recipe:${id}`);save();switchView('recipes');toast('Rezept gelöscht')}
function bindRecipeCards(root){$$('.recipe-add',root).forEach(button=>button.onclick=()=>addRecipeToShopping(allRecipes().find(recipe=>recipe.id===button.dataset.recipe)));$$('[data-watch-recipe]',root).forEach(button=>button.onclick=()=>{const id=button.dataset.watchRecipe;state.watchedRecipes=state.watchedRecipes.includes(id)?state.watchedRecipes.filter(item=>item!==id):[...state.watchedRecipes,id];save();switchView('recipes')});$$('[data-delete-recipe]',root).forEach(button=>button.onclick=()=>deleteRecipe(button.dataset.deleteRecipe));$$('.recipe-visual img',root).forEach(img=>img.onerror=()=>img.remove());loadRecipeImages(root)}
function youtubeVideoCard(video){const watched=state.watchedVideos.includes(video.id);const views=video.views?`${video.views.toLocaleString('de-DE')} Aufrufe`:'Aufrufe nicht verfügbar';return `<article class="youtube-video-card${watched?' watched':''}"><div class="youtube-video-visual"><img src="${escapeHtml(video.image)}" alt="Vorschaubild ${escapeHtml(video.title)}" loading="lazy" referrerpolicy="no-referrer"><button data-watch-video="${video.id}" aria-pressed="${watched}">${watched?'✓ Angesehen':'Als angesehen markieren'}</button></div><div class="youtube-video-tags"><span>${escapeHtml(video.channel||'YouTube')}</span><span>${escapeHtml(video.meal||'Weitere')}</span><span>${escapeHtml(video.cuisine||'Weitere')}</span></div><h2>${escapeHtml(video.title)}</h2><p>${escapeHtml(video.meta||video.channel||'Rezeptvideo')}</p><div class="youtube-video-facts"><span><small>BELIEBTHEIT</small><strong>${escapeHtml(views)}</strong></span><span><small>KATEGORIE</small><strong>${escapeHtml(video.meal||'Weitere')}</strong></span></div><div class="youtube-video-actions"><a href="${escapeHtml(video.url)}" target="_blank" rel="noopener">▶ Video</a><button data-read-video-recipe="${video.id}">📖 Rezept lesen</button></div></article>`}
function suggestedVideoIngredients(video){if(video.meal==='Frühstück')return ['Grundlage aus dem Videotitel – nach Bedarf','Milchprodukt oder pflanzliche Alternative – nach Bedarf','Obst, Gemüse oder Topping – nach Geschmack'];if(video.meal==='Backen & Dessert')return ['Mehl oder passende trockene Grundlage – nach Bedarf','Eier oder Bindemittel – nach Bedarf','Milch, Butter oder pflanzliche Alternative – nach Bedarf','Süße und Gewürze – nach Geschmack'];if(video.meal==='Snack & Beilage')return ['Hauptzutat aus dem Videotitel – nach Bedarf','Öl oder Dressing – nach Bedarf','Kräuter und Gewürze – nach Geschmack'];if(video.cuisine==='Persisch')return ['Hauptzutat aus dem Videotitel – nach Bedarf','Zwiebel und frische Kräuter – nach Geschmack','Persische Gewürze – nach Geschmack','Reis oder passende Beilage – nach Bedarf'];return ['Hauptzutat aus dem Videotitel – nach Bedarf','Gemüse oder Beilage – nach Bedarf','Öl oder Kochfett – nach Bedarf','Salz, Pfeffer und Gewürze – nach Geschmack']}
function openVideoRecipe(video,root){const dialog=$('#videoRecipeDialog',root),recipe=video.recipe||{},originalIngredients=recipe.ingredients||[],ingredients=originalIngredients.length?originalIngredients:suggestedVideoIngredients(video),steps=recipe.steps||[],sourceType=originalIngredients.length?recipe.sourceType:'KI-Zutatenvorschlag und KI-Ablauf aus dem Videotitel';dialog.innerHTML=`<div class="video-recipe-dialog-head"><div><p class="eyebrow">${escapeHtml(video.channel||'REZEPTVIDEO')}</p><h2>${escapeHtml(video.title)}</h2><span>${escapeHtml(sourceType)}</span></div><button type="button" aria-label="Schließen">×</button></div><div class="video-recipe-dialog-body"><section><h3>${originalIngredients.length?'Zutaten aus der Videobeschreibung':'Vorgeschlagene Zutaten'}</h3><ul>${ingredients.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section><section><h3>Zubereitung</h3>${steps.length?`<ol>${steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol>`:'<p>Noch keine schriftliche Anleitung verfügbar.</p>'}</section><p class="video-recipe-notice">${escapeHtml(recipe.notice||'Die schriftliche Fassung ist eine Orientierung. Angaben bitte mit dem Originalvideo abgleichen.')}</p><a class="btn primary" href="${escapeHtml(video.url)}" target="_blank" rel="noopener">Originalvideo öffnen ↗</a></div>`;$('button',dialog).onclick=()=>dialog.close();dialog.showModal()}
async function loadYouTubeCatalog(root){
  const grid=$('#youtubeVideoGrid',root),status=$('#youtubeVideoStatus',root),search=$('#youtubeVideoSearch',root),sort=$('#youtubeVideoSort',root),channel=$('#youtubeVideoChannel',root),meal=$('#youtubeVideoMeal',root),cuisine=$('#youtubeVideoCuisine',root),more=$('#youtubeVideoMore',root);let videos=[],limit=48;
  const render=()=>{const query=search.value.trim().toLocaleLowerCase('de');let filtered=videos.map((video,index)=>({...video,index})).filter(video=>(!query||`${video.title} ${video.channel}`.toLocaleLowerCase('de').includes(query))&&(channel.value==='all'||video.channel===channel.value)&&(meal.value==='all'||video.meal===meal.value)&&(cuisine.value==='all'||video.cuisine===cuisine.value));const watched=new Set(state.watchedVideos);if(sort.value==='unwatched')filtered.sort((a,b)=>Number(watched.has(a.id))-Number(watched.has(b.id))||a.index-b.index);if(sort.value==='watched')filtered.sort((a,b)=>Number(watched.has(b.id))-Number(watched.has(a.id))||a.index-b.index);if(sort.value==='popular')filtered.sort((a,b)=>(b.views||0)-(a.views||0)||a.index-b.index);if(sort.value==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title,'de'));grid.innerHTML=filtered.slice(0,limit).map(youtubeVideoCard).join('');status.textContent=`${filtered.length.toLocaleString('de-DE')} Top-Rezepte · ${state.watchedVideos.length.toLocaleString('de-DE')} angesehen`;more.classList.toggle('hidden',limit>=filtered.length);$$('[data-watch-video]',grid).forEach(button=>button.onclick=()=>{const id=button.dataset.watchVideo;state.watchedVideos=state.watchedVideos.includes(id)?state.watchedVideos.filter(item=>item!==id):[...state.watchedVideos,id];save();render()});$$('[data-read-video-recipe]',grid).forEach(button=>button.onclick=()=>openVideoRecipe(videos.find(video=>video.id===button.dataset.readVideoRecipe),root));$$('img',grid).forEach(img=>img.onerror=()=>img.remove())};
  const resetAndRender=()=>{limit=48;render()};search.oninput=resetAndRender;sort.value=state.videoSort;channel.value=state.videoChannel;meal.value=state.videoMeal;cuisine.value=state.videoCuisine;sort.onchange=()=>{state.videoSort=sort.value;save();resetAndRender()};channel.onchange=()=>{state.videoChannel=channel.value;save();resetAndRender()};meal.onchange=()=>{state.videoMeal=meal.value;save();resetAndRender()};cuisine.onchange=()=>{state.videoCuisine=cuisine.value;save();resetAndRender()};more.onclick=()=>{limit+=48;render()};
  try{const response=await fetch(`./recipe-videos.json?update=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(`Videokatalog ${response.status}`);const data=await response.json();videos=(data.videos||[]).filter(video=>video.featured);render()}catch(error){console.error(error);status.textContent='Videokatalog konnte gerade nicht geladen werden';grid.innerHTML='<a class="btn ghost" href="https://www.youtube.com/@SchmaleSchulter/videos" target="_blank" rel="noopener">Schmale Schulter bei YouTube öffnen ↗</a><a class="btn ghost" href="https://www.youtube.com/channel/UCvd5wsIuZzEYA55cZkt7hIQ/videos" target="_blank" rel="noopener">Yummy Gastronomy bei YouTube öffnen ↗</a>';more.classList.add('hidden')}
}
function exportBackup(){const blob=new Blob([JSON.stringify({version:'0.18.0-beta.1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`fami-backup-${isoDate(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Sicherung heruntergeladen – Fotos und Anhänge sind nicht enthalten')}
async function importBackup(file){try{const data=JSON.parse(await file.text());if(!data.state?.tasks||!data.state?.events)throw new Error();localStorage.setItem('fami-state',JSON.stringify(data.state));toast('Sicherung importiert – App wird neu geladen');setTimeout(()=>location.reload(),800)}catch{toast('Diese Sicherungsdatei ist ungültig')}}
async function renderFileLibrary(){
  const host=$('#fileLibrary');if(!host)return;const files=await getAllAttachments();host.innerHTML='';files.forEach(file=>{const card=document.createElement('article');card.className='library-file';card.innerHTML=`<span class="file-kind">${file.type?.startsWith('image/')?'FOTO':'DATEI'}</span><strong></strong><small></small><div><button class="open-library-file">Öffnen</button><button class="delete-library-file">Löschen</button></div>`;$('strong',card).textContent=file.name;$('small',card).textContent=`${Math.max(1,Math.round(file.size/1024))} KB · ${file.entity.startsWith('task:')?'Aufgabe':file.entity.startsWith('event:')?'Termin':'Allgemein'}`;$('.open-library-file',card).onclick=()=>{const url=URL.createObjectURL(file.blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('.delete-library-file',card).onclick=async()=>{await removeAttachment(file);renderFileLibrary();toast('Datei gelöscht')};host.append(card)});if(!files.length)host.innerHTML='<div class="task-empty">Noch keine Dateien gespeichert.</div>';
}

const views={
  calendar:{eyebrow:'GEMEINSAMER ÜBERBLICK',title:'Familienkalender',desc:'Alle Termine, farblich nach Person – ohne versteckte Einträge.',features:[['Persönliche Filter','Zeige alle oder nur deine eigenen Termine.'],['Sicher synchronisiert','Jede Änderung erscheint im Aktivitätsverlauf.'],['Wiederholungen','Schule, Sport und Routinen einmalig planen.']]},
  files:{eyebrow:'ALLES WICHTIGE',title:'Fotos & Dateien',desc:'Erinnerungen und Dokumente sicher mit der Familie teilen.',features:[['Gemeinsame Alben','Fotos sammeln, kommentieren und wiederfinden.'],['Dokumentenablage','Stundenpläne, Briefe und PDFs griffbereit.'],['Klare Rechte','Festlegen, wer ansehen, ergänzen oder löschen darf.']]}
};
function activitySectionMarkup(){
  const profile=state.familyProfile;
  const ageFields=family.map(name=>`<label>${escapeHtml(name)} – Alter<input class="member-age-input" data-age-person="${escapeHtml(name)}" type="number" min="0" max="120" value="${state.memberAges[name]??''}" placeholder="optional"></label>`).join('');
  return `<section class="calendar-discovery"><div class="discovery-heading"><p class="eyebrow">GEMEINSAM ETWAS ERLEBEN</p><h2>Aktivitäten entdecken</h2><p>Live-Veranstaltungen passend zu eurem Ort suchen und direkt zum Kalender hinzufügen.</p></div><section class="discovery-settings live-event-settings"><label>Ort oder PLZ<input id="activityLocation" value="${escapeHtml(profile.location)}"></label><label>Suchbegriff<input id="activityKeyword" value="${escapeHtml(profile.keyword||'Kinder Familie')}" placeholder="z. B. Kinder, Theater, Kürbisfest"></label><label>Ticketmaster API-Key<input id="ticketmasterKey" type="password" value="${escapeHtml(localStorage.getItem('fami-ticketmaster-key')||'')}" placeholder="Eigener kostenloser API-Key"></label><button class="btn primary" id="refreshIdeas">Live-Termine suchen</button></section><details class="age-settings"><summary>Altersangaben für passendere Vorschläge</summary><div>${ageFields}</div></details><div class="demo-note"><strong>${escapeHtml(activitySource)}</strong><span>${activitySource.startsWith('Live')?'Termine werden von Ticketmaster bereitgestellt. Angaben und Altersfreigaben bitte beim Veranstalter prüfen.':'Ohne API-Key bleiben geprüfte Beispielideen sichtbar. Einen Key erhältst du kostenlos im Ticketmaster Developer Portal.'}</span></div><section class="activity-grid">${discoveredActivityIdeas.map(item=>`<article class="activity-card"><span class="activity-emoji">${item.icon}</span><div class="activity-meta"><span>${escapeHtml(item.category)}</span><span>${escapeHtml(item.distance)}</span></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.text)}</p><div class="activity-bottom"><span>${escapeHtml(item.when)}</span><small>${escapeHtml(item.ages)}</small></div><div class="activity-actions"><button class="add-activity">Zum Kalender</button>${item.url?`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Details ↗</a>`:''}</div></article>`).join('')}</section></section>`;
}
function bindActivitySection(root){
  const discoveryIntro=$('.discovery-heading>p:last-child',root);if(discoveryIntro)discoveryIntro.textContent='Stadtteilfeste, Märkte, Kultur und Familienangebote aus offiziellen regionalen Kalendern – mit Schwerpunkt Misburg-Anderten.';
  const ticketmasterField=$('#ticketmasterKey',root)?.closest('label');if(ticketmasterField)ticketmasterField.classList.add('hidden');
  const settings=$('.live-event-settings',root);if(settings)settings.classList.add('regional-event-settings');
  const searchButton=$('#refreshIdeas',root);if(searchButton)searchButton.textContent='Regionale Termine suchen';
  const keywordInput=$('#activityKeyword',root);if(keywordInput){if(keywordInput.value==='Kinder Familie')keywordInput.value='';keywordInput.placeholder='z. B. Stadtteilfest, Markt, Konzert';const label=keywordInput.closest('label');if(label?.firstChild)label.firstChild.textContent='Suchbegriff (optional)'}
  const sourceText=$('.demo-note span',root);if(sourceText)sourceText.textContent=activitySource.startsWith('Live')?'Aktuelle Metadaten von Hannover.de. Bitte Details und mögliche Änderungen bei der Originalquelle prüfen.':activitySource.includes('keine passenden')?'Für diese Suche gibt es im aktuellen Hannover-Feed keine Treffer. Versuche einen allgemeineren Suchbegriff.':activitySource.includes('nicht erreichbar')?'Der regionale Feed konnte gerade nicht geladen werden. Beispielideen bleiben sichtbar.':'Offizielle Quellen: Hannover.de, Bürgerhaus Misburg und Stadtbezirk Misburg-Anderten.';
  $('#refreshIdeas',root).onclick=loadRegionalEvents;$$('[data-age-person]',root).forEach(input=>input.onchange=()=>{if(input.value==='')delete state.memberAges[input.dataset.agePerson];else state.memberAges[input.dataset.agePerson]=Number(input.value);save()});
  $$('.add-activity',root).forEach((button,index)=>button.onclick=()=>{const idea=discoveredActivityIdeas[index];state.events.push({id:`event-${Date.now()}-${index}`,title:idea.title,date:idea.date||'',time:idea.time||'11:00',place:`${idea.text} · ${state.familyProfile.location}`,people:[...family],color:'green'});save();applyHomeCalendarFilter();renderCalendarManager();renderMonthCalendar();toast('Aktivität zum Familienkalender hinzugefügt')});
}
async function loadTicketmasterEventsLegacy(){
  const location=$('#activityLocation').value.trim()||'Berlin';const keyword=$('#activityKeyword').value.trim()||'Kinder';const apiKey=$('#ticketmasterKey').value.trim();state.familyProfile={...state.familyProfile,location,keyword};save();if(!apiKey){activitySource='Beispielvorschläge – Ticketmaster API-Key fehlt';discoveredActivityIdeas=[...fallbackActivityIdeas];switchView('calendar');return toast('Für Live-Termine bitte einen Ticketmaster API-Key eintragen')};localStorage.setItem('fami-ticketmaster-key',apiKey);const params=new URLSearchParams({apikey:apiKey,countryCode:'DE',locale:'de-de',size:'12',sort:'date,asc',keyword});if(/^\d{5}$/.test(location))params.set('postalCode',location);else params.set('city',location);params.set('radius','50');params.set('unit','km');const start=new Date();const end=new Date(Date.now()+1000*60*60*24*90);params.set('startDateTime',start.toISOString().replace(/\.\d{3}Z$/,'Z'));params.set('endDateTime',end.toISOString().replace(/\.\d{3}Z$/,'Z'));try{toast('Regionale Veranstaltungen werden geladen …');const response=await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);if(!response.ok)throw new Error(`Ticketmaster ${response.status}`);const data=await response.json();const events=data._embedded?.events||[];if(!events.length){activitySource=`Keine Live-Termine für „${keyword}“ gefunden`;discoveredActivityIdeas=[...fallbackActivityIdeas]}else{discoveredActivityIdeas=events.map(event=>{const venue=event._embedded?.venues?.[0];const date=event.dates?.start?.localDate||'';const time=event.dates?.start?.localTime?.slice(0,5)||'11:00';return {icon:'🎟️',title:event.name,category:event.classifications?.[0]?.genre?.name||'Veranstaltung',ages:'Altersfreigabe prüfen',distance:venue?.city?.name||location,when:date?new Date(`${date}T12:00`).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'short'}):'Termin prüfen',text:venue?.name||'Veranstaltungsort siehe Details',date,time,url:event.url||''}});activitySource=`Live: ${events.length} Termine im Raum ${location}`};switchView('calendar')}catch(error){console.error(error);activitySource='Live-Suche derzeit nicht erreichbar';discoveredActivityIdeas=[...fallbackActivityIdeas];switchView('calendar');toast('Live-Termine konnten nicht geladen werden – Beispiele werden angezeigt')}
}
async function loadRegionalEvents(){
  const location=$('#activityLocation').value.trim()||'Hannover';
  const rawKeyword=$('#activityKeyword').value.trim().toLocaleLowerCase('de');const keyword=rawKeyword==='kinder familie'?'':rawKeyword;
  state.familyProfile={...state.familyProfile,location,keyword};save();
  try{
    toast('Regionale Familienangebote werden geladen …');
    const response=await fetch(`./regional-events.json?update=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(`Regionaler Feed ${response.status}`);
    const data=await response.json();
    const supportsHannover=/hannover|misburg|anderten|^30\d{3}$|garbsen|langenhagen|laatzen|seelze|ronnenberg|hemmingen|lehrte|burgdorf|wedemark|neustadt|springe|pattensen|isernhagen|uetze/i.test(location);
    let events=supportsHannover?(data.events||[]).filter(event=>!/sprach(?:en)?caf[eé]|sprechstund/i.test(`${event.title} ${event.category}`)):[];
    if(keyword)events=events.filter(event=>`${event.title} ${event.category} ${event.venue}`.toLocaleLowerCase('de').includes(keyword));
    if(/misburg|anderten|30629|30559/i.test(location)){const local=events.filter(event=>/misburg|anderten|30629|30559/i.test(`${event.title} ${event.category} ${event.venue}`));const hannover=events.filter(event=>!/misburg|anderten|30629|30559/i.test(`${event.title} ${event.category} ${event.venue}`));events=[...local.slice(0,10),...hannover.slice(0,10)].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de'))}
    if(!events.length){activitySource=supportsHannover?'Der regionale Kalender enthält keine passenden Treffer':'Für diesen Ort ist noch keine kommunale Quelle eingerichtet';discoveredActivityIdeas=[...fallbackActivityIdeas]}
    else{discoveredActivityIdeas=events.slice(0,20).map(event=>({icon:/kinder/i.test(event.category)?'🧒':/markt|fest/i.test(event.category)?'🎃':'📍',title:event.title,category:event.category,ages:/kinder/i.test(event.category)?'Für Familien':'Details prüfen',distance:event.venue||'Region Hannover',when:new Date(`${event.date}T12:00`).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'short'}),text:`Regionaler Termin · Quelle: ${data.source||'Hannover.de'}`,date:event.date,time:'11:00',url:event.url}));activitySource=`Live: ${events.length} regionale Termine aus ${data.source||'Hannover.de'}`}
    switchView('calendar');
  }catch(error){console.error(error);activitySource='Regionaler Veranstaltungskalender derzeit nicht erreichbar';discoveredActivityIdeas=[...fallbackActivityIdeas];switchView('calendar');toast('Regionale Termine konnten nicht geladen werden – Beispiele werden angezeigt')}
}
function switchView(name){
  currentView=name;
  const navigationView=name==='shopping'?'tasks':name;
  $$('.nav-item,.mobile-nav button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===navigationView));
  if(name==='home'){$('#homeView').classList.remove('hidden');$('#genericView').classList.add('hidden');return}
  $('#homeView').classList.add('hidden');const box=$('#genericView');box.classList.remove('hidden');
  if(name==='family'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">EURE FAMILIE</p><h1>Familie bearbeiten</h1><p>Familienname, Profile und Altersangaben für passende Vorschläge verwalten.</p></div></div><form class="family-settings-form" id="familySettingsForm"><label>Familienname<input id="editFamilyName" required maxlength="80" value="${escapeHtml(state.familyName)}"></label><label>Wer nutzt dieses Gerät?<select id="editCurrentUser">${family.map(name=>`<option ${name===state.currentUser?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select></label><div class="family-settings-heading"><strong>Familienprofile</strong><button type="button" class="btn ghost" id="addFamilyMember"><svg><use href="#i-plus"/></svg>Mitglied hinzufügen</button></div><div class="family-member-list" id="familyMemberList">${family.map(familyMemberRow).join('')}</div><div class="family-settings-actions"><button class="btn primary">Änderungen speichern</button></div></form>`;bindFamilySettings(box);return;
  }
  if(name==='tasks'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">GEMEINSAM ORGANISIERT</p><h1>Aufgaben & Einkaufen</h1><p>Aufgaben verteilen und gemeinsame Einkäufe planen.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neue Aufgabe</span></button></div><nav class="section-tabs" aria-label="Aufgaben und Einkauf"><button class="active" data-section="tasks"><svg><use href="#i-check"/></svg>Aufgaben</button><button data-section="shopping"><svg><use href="#i-cart"/></svg>Einkaufsliste <span>${state.shoppingItems.filter(item=>!item.done).length}</span></button></nav>${peoplePicker('task')}<section class="empty-shell"><div class="task-tools"><div class="task-filters"><button class="active" data-filter="open">Offen</button><button data-filter="done">Erledigt</button><button data-filter="all">Alle</button></div><p id="managerCount"></p></div><div class="task-manager" id="managedTasks"></div></section>`;
    $('.sub-add',box).onclick=()=>openModal('task');$$('[data-section]',box).forEach(button=>button.onclick=()=>switchView(button.dataset.section));$$('[data-filter]',box).forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;$$('[data-filter]',box).forEach(x=>x.classList.toggle('active',x===b));renderTaskManager()});bindPeoplePicker(box,'task');renderTaskManager();return;
  }
  if(name==='shopping'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">GEMEINSAM ORGANISIERT</p><h1>Aufgaben & Einkaufen</h1><p>Aufgaben verteilen und gemeinsame Einkäufe planen.</p></div></div><nav class="section-tabs" aria-label="Aufgaben und Einkauf"><button data-section="tasks"><svg><use href="#i-check"/></svg>Aufgaben</button><button class="active" data-section="shopping"><svg><use href="#i-cart"/></svg>Einkaufsliste <span>${state.shoppingItems.filter(item=>!item.done).length}</span></button></nav><form class="shopping-add" id="shoppingForm"><input id="shoppingName" required placeholder="Was wird benötigt?"><input id="shoppingQuantity" placeholder="Menge, z. B. 2 Stück"><button class="btn primary">Hinzufügen</button></form><div class="shopping-actions"><span id="shoppingSummary"></span><button id="clearBought">Erledigte entfernen</button></div><div class="shopping-list" id="shoppingList"></div>`;
    $$('[data-section]',box).forEach(button=>button.onclick=()=>switchView(button.dataset.section));$('#shoppingForm').onsubmit=e=>{e.preventDefault();addShoppingItem($('#shoppingName').value.trim(),$('#shoppingQuantity').value.trim()||'1');e.target.reset();switchView('shopping');toast('Zur Einkaufsliste hinzugefügt')};$('#clearBought').onclick=()=>{state.shoppingItems=state.shoppingItems.filter(item=>!item.done);save();switchView('shopping');toast('Erledigte Einkäufe entfernt')};renderShoppingList();return;
  }
  if(name==='recipes'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">EINFACH GUT ESSEN</p><h1>Rezepte</h1><p>Lieblingsrezepte per Foto oder Link sammeln und Zutaten direkt übernehmen.</p></div><button class="btn primary" id="toggleRecipeForm"><svg><use href="#i-plus"/></svg><span>Rezept hinzufügen</span></button></div><form class="recipe-import hidden" id="recipeImport"><div class="recipe-import-head"><div><strong>Eigenes Rezept speichern</strong><small>Foto oder Link auswählen und die Zutaten einmal eintragen.</small></div><button type="button" id="closeRecipeForm" aria-label="Schließen">×</button></div><div class="recipe-source-tabs"><label><input type="radio" name="recipeSource" value="photo" checked><span>📷 Per Foto</span></label><label><input type="radio" name="recipeSource" value="link"><span>🔗 Per Link</span></label></div><label>Rezeptname<input id="recipeTitle" required placeholder="z. B. Omas Kartoffelsuppe"></label><label class="recipe-photo-field">Rezeptfoto<input type="file" id="recipePhoto" accept="image/*" capture="environment"></label><label class="recipe-link-field hidden">Link<input type="url" id="recipeUrl" placeholder="https://…"></label><label>Zutaten<textarea id="recipeIngredients" required rows="6" placeholder="Eine Zutat pro Zeile, zum Beispiel:\nKartoffeln | 1 kg\nZwiebeln | 2 Stück\nSalz | nach Bedarf"></textarea><small>Format: Zutat | Menge</small></label><label>Kochanleitung (optional)<textarea id="recipeSteps" rows="5" placeholder="Ein Arbeitsschritt pro Zeile"></textarea></label><button class="btn primary">Rezept speichern</button></form><div class="recipe-source-note">Eigene Rezepte und Fotos bleiben lokal auf diesem Gerät gespeichert. Links werden als Quelle hinterlegt.</div><section class="recipe-grid">${allRecipes().map(recipeCard).join('')}</section>`;
    const form=$('#recipeImport');const sourceNote=$('.recipe-source-note',box);sourceNote.innerHTML='Öffentlich verfügbare Rezepte zeigen Nährwerte, YouTube-Vorschaubild und Quellenlink. <a href="https://www.youtube.com/@SchmaleSchulter" target="_blank" rel="noopener">Schmale Schulter ↗</a> · <a href="https://www.youtube.com/channel/UCvd5wsIuZzEYA55cZkt7hIQ/videos" target="_blank" rel="noopener">Yummy Gastronomy ↗</a> · <a href="https://schmaleschulter.de/products/schmackofatz" target="_blank" rel="noopener">Offizielles Kochbuch ↗</a>';$('#toggleRecipeForm').onclick=()=>form.classList.toggle('hidden');$('#closeRecipeForm').onclick=()=>form.classList.add('hidden');
    const sorter=document.createElement('label');sorter.className='recipe-sort';sorter.innerHTML=`<span>Rezeptvideos sortieren</span><select><option value="unwatched" ${state.recipeSort==='unwatched'?'selected':''}>Ungesehen zuerst</option><option value="watched" ${state.recipeSort==='watched'?'selected':''}>Angesehen zuerst</option><option value="default" ${state.recipeSort==='default'?'selected':''}>Standard-Reihenfolge</option></select>`;$('.recipe-grid',box).before(sorter);$('select',sorter).onchange=e=>{state.recipeSort=e.target.value;save();switchView('recipes')};
    const library=document.createElement('section');library.className='youtube-library';library.innerHTML='<div><p class="eyebrow">200 AUSGEWÄHLTE REZEPTVIDEOS</p><h2>Top 100 Schmale Schulter & Top 100 Yummy Gastronomy</h2><p>Große Rezeptkarten mit getrenntem Video- und Leserezept. Zutaten stammen soweit möglich aus der Videobeschreibung; ergänzte Abläufe sind deutlich als KI-Entwurf gekennzeichnet.</p></div><div class="youtube-catalog-tools"><input id="youtubeVideoSearch" type="search" placeholder="Rezepte durchsuchen …"><select id="youtubeVideoChannel"><option value="all">Alle Kanäle</option><option value="Schmale Schulter">Schmale Schulter</option><option value="Yummy Gastronomy">Yummy Gastronomy</option></select><select id="youtubeVideoMeal"><option value="all">Alle Mahlzeiten</option><option>Frühstück</option><option>Hauptgericht</option><option>Backen & Dessert</option><option>Snack & Beilage</option><option>Getränke</option><option>Weitere</option></select><select id="youtubeVideoCuisine"><option value="all">Alle Küchen</option><option>Persisch</option><option>Westlich</option><option>International</option><option>Weitere</option></select><select id="youtubeVideoSort"><option value="popular">Beliebt nach Aufrufen</option><option value="newest">Neueste zuerst</option><option value="unwatched">Ungesehen zuerst</option><option value="watched">Angesehen zuerst</option><option value="title">Nach Titel</option></select></div><p class="youtube-video-status" id="youtubeVideoStatus">Rezeptkarten werden geladen …</p><div class="youtube-video-grid" id="youtubeVideoGrid"></div><button class="btn ghost" id="youtubeVideoMore">Mehr Rezeptkarten laden</button><dialog class="video-recipe-dialog" id="videoRecipeDialog"></dialog>';box.append(library);if(!['popular','newest','unwatched','watched','title'].includes(state.videoSort))state.videoSort='popular';loadYouTubeCatalog(library);
    $$('[name="recipeSource"]',form).forEach(input=>input.onchange=()=>{const link=input.value==='link'&&input.checked;$('.recipe-photo-field',form).classList.toggle('hidden',link);$('.recipe-link-field',form).classList.toggle('hidden',!link);$('#recipeUrl').required=link;$('#recipePhoto').required=!link});$('#recipePhoto').required=true;
    form.onsubmit=async e=>{e.preventDefault();const ingredients=parseIngredients($('#recipeIngredients').value);if(!ingredients.length)return;const id=`recipe-${Date.now()}`;const photo=$('#recipePhoto').files[0];const steps=$('#recipeSteps').value.split('\n').map(step=>step.trim()).filter(Boolean);const recipe={id,title:$('#recipeTitle').value.trim(),emoji:'🍲',source:'Eigenes Rezept',url:$('#recipeUrl').value.trim(),time:'Eigene Sammlung',portions:'',tags:['Eigenes Rezept'],ingredients,steps,custom:true,hasPhoto:Boolean(photo)};state.customRecipes.unshift(recipe);if(photo)await storeAttachments(`recipe:${id}`,[photo]);save();switchView('recipes');toast('Rezept gespeichert')};bindRecipeCards(box);return;
  }
  if(name==='files'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">ALLES WICHTIGE</p><h1>Fotos & Dateien</h1><p>Anhänge aus Aufgaben und Terminen – online geteilt oder offline auf diesem Gerät.</p></div><label class="btn primary library-upload"><svg><use href="#i-upload"/></svg><span>Dateien hinzufügen</span><input type="file" id="libraryUploadInput" multiple></label></div><section class="file-library" id="fileLibrary"></section>`;$('#libraryUploadInput').onchange=async e=>{await storeAttachments('general:shared',e.target.files);e.target.value='';renderFileLibrary();toast('Dateien gespeichert')};renderFileLibrary();return;
  }
  if(name==='more'){
    box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">WEITERE BEREICHE</p><h1>Mehr</h1><p>Alles Weitere für euren Familienalltag.</p></div></div><section class="more-grid"><button data-jump="family"><svg><use href="#i-people"/></svg><strong>Familie bearbeiten</strong><span>${family.length} Profile · ${escapeHtml(state.familyName)}</span></button><button data-jump="shopping"><svg><use href="#i-cart"/></svg><strong>Einkaufsliste</strong><span>${state.shoppingItems.filter(item=>!item.done).length} offene Einträge</span></button><button data-jump="recipes"><svg><use href="#i-book"/></svg><strong>Rezepte</strong><span>Ideen & Zutaten</span></button><button data-jump="files"><svg><use href="#i-folder"/></svg><strong>Dateien</strong><span>Fotos & Dokumente</span></button></section><section class="backup-panel"><div><strong>Lokale Datensicherung</strong><span>Aufgaben, Termine, Filter und Einkaufsliste sichern. Anhänge sind nicht enthalten.</span></div><button class="btn ghost" id="exportBackup">Sicherung herunterladen</button><label class="btn ghost">Sicherung importieren<input type="file" id="importBackup" accept="application/json"></label></section>`;$$('[data-jump]',box).forEach(button=>button.onclick=()=>switchView(button.dataset.jump));$('#exportBackup').onclick=exportBackup;$('#importBackup').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0])};return;
  }
  if(name==='calendar'){
    box.innerHTML=`<div class="subview-head calendar-head"><div><p class="eyebrow">GEMEINSAMER ÜBERBLICK</p><h1>Familienkalender</h1><p>Monatsübersicht für eure Termine, Feiertage und Schulferien.</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neuer Termin</span></button></div><section class="month-shell"><div class="month-toolbar"><button id="prevMonth">‹</button><h2 id="monthTitle"></h2><button id="nextMonth">›</button><button id="todayMonth">Heute</button></div><div class="month-calendar" id="monthCalendar"></div></section><details class="calendar-options"><summary>Ansicht, Feiertage & Ferien auswählen</summary><div class="calendar-options-body">${peoplePicker('calendar')}<section class="holiday-controls"><label>Bundesland<select id="holidayRegion">${Object.entries(subdivisions).map(([code,name])=>`<option value="${code}" ${code===state.holidaySettings.subdivision?'selected':''}>${name}</option>`).join('')}</select></label><label class="calendar-toggle"><input id="showPublic" type="checkbox" ${state.holidaySettings.showPublic?'checked':''}><span></span>Feiertage</label><label class="calendar-toggle"><input id="showSchool" type="checkbox" ${state.holidaySettings.showSchool?'checked':''}><span></span>Schulferien</label><small id="holidayStatus">Daten passend zum gewählten Bundesland</small></section></div></details><h2 class="list-heading">Terminliste</h2><section class="empty-shell calendar-list-shell"><div class="calendar-manager" id="calendarEntries"></div></section>${activitySectionMarkup()}`;
    const createButton=$('.sub-add',box);const calendarActions=document.createElement('div');calendarActions.className='calendar-head-actions';createButton.replaceWith(calendarActions);calendarActions.innerHTML='<label class="btn ghost calendar-import">Kalender importieren<input type="file" accept=".ics,text/calendar"></label><button class="btn ghost calendar-export">Kalender exportieren</button>';calendarActions.append(createButton);createButton.onclick=()=>openModal('event');$('.calendar-export',calendarActions).onclick=exportCalendarIcs;$('input',calendarActions).onchange=async e=>{if(e.target.files[0])await importCalendarIcs(e.target.files[0]);e.target.value=''};bindPeoplePicker(box,'calendar');renderCalendarManager();renderMonthCalendar();loadHolidayData();
    $('#prevMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderMonthCalendar();loadHolidayData()};$('#nextMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderMonthCalendar();loadHolidayData()};$('#todayMonth').onclick=()=>{calendarCursor=new Date(today.getFullYear(),today.getMonth(),1);renderMonthCalendar();loadHolidayData()};
    $('#holidayRegion').onchange=e=>{state.holidaySettings.subdivision=e.target.value;save();loadHolidayData()};$('#showPublic').onchange=e=>{state.holidaySettings.showPublic=e.target.checked;save();renderMonthCalendar()};$('#showSchool').onchange=e=>{state.holidaySettings.showSchool=e.target.checked;save();renderMonthCalendar()};bindActivitySection(box);return;
  }
  const v=views[name];box.innerHTML=`<div class="subview-head"><div><p class="eyebrow">${v.eyebrow}</p><h1>${v.title}</h1><p>${v.desc}</p></div><button class="btn primary sub-add"><svg><use href="#i-plus"/></svg><span>Neu erstellen</span></button></div><section class="empty-shell"><div class="feature-grid">${v.features.map(x=>`<article class="feature-item"><strong>${x[0]}</strong><p>${x[1]}</p></article>`).join('')}</div></section>`;$('.sub-add',box).onclick=()=>openModal(name==='calendar'?'event':'note');
}
$$('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));$$('.nav-link').forEach(b=>b.onclick=()=>switchView(b.dataset.target));
$('#familySettingsBtn').onclick=()=>switchView('family');$('#profileBtn').onclick=()=>switchView('family');
$('#globalSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('.event,.task,.file-tile').forEach(el=>el.style.display=el.textContent.toLowerCase().includes(q)?'':'none')});

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('#installApp').classList.remove('hidden')});
$('#installApp').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')toast('Fami wird installiert');installPrompt=null;$('#installApp').classList.add('hidden')};
window.addEventListener('appinstalled',()=>toast('Fami ist jetzt auf deinem Gerät'));
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));

syncFamilyUi();renderHomeTasks();applyHomeCalendarFilter();updateShoppingCount();save();
window.FamiCloud?.init({
  getState:()=>JSON.parse(JSON.stringify(state)),
  applyState:payload=>{
    if(!payload||!Array.isArray(payload.tasks)||!Array.isArray(payload.events))return;
    Object.assign(state,payload);
    family=Array.isArray(state.familyMembers)&&state.familyMembers.length?[...state.familyMembers]:family;
    localStorage.setItem('fami-state',JSON.stringify(state));
    syncFamilyUi();renderHomeTasks();applyHomeCalendarFilter();updateShoppingCount();
    if(currentView!=='home')switchView(currentView);
  },
  notify:toast
});
