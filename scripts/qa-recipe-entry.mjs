import {spawn} from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

let qaServer;
let url=process.argv[2];
if(!url){
  const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
  qaServer=http.createServer((request,response)=>{const pathname=new URL(request.url,'http://127.0.0.1').pathname,filePath=path.join(root,pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^\//,''));if(!filePath.startsWith(root)){response.writeHead(403);response.end();return}fs.readFile(filePath,(error,data)=>{if(error){response.writeHead(404);response.end();return}response.writeHead(200,{'Content-Type':types[path.extname(filePath)]||'application/octet-stream','Cache-Control':'no-store'});response.end(data)})});
  await new Promise(resolve=>qaServer.listen(0,'127.0.0.1',resolve));
  url=`http://127.0.0.1:${qaServer.address().port}/`;
}
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port=9555+Math.floor(Math.random()*200);
const profile=`${process.env.TEMP}\\fami-recipe-qa-${port}`;
const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--window-size=390,844','--disable-gpu','--no-first-run','about:blank'],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket,nextId=0;
const pending=new Map();
async function connect(){
  let page;
  for(let attempt=0;attempt<80&&!page;attempt++){
    await wait(150);
    try{const targets=await fetch(`http://127.0.0.1:${port}/json/list`).then(response=>response.json());page=targets.find(item=>item.type==='page')}catch{}
  }
  if(!page)throw new Error('Testbrowser nicht erreichbar');
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}};
}
function send(method,params={}){const id=++nextId;socket.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}))}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value}
const results=[];
const check=(name,passed,detail='')=>results.push({name,passed:Boolean(passed),detail});
try{
  await connect();
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});await send('Page.navigate',{url:`${url}?view=recipes&qa=${Date.now()}`});
  for(let attempt=0;attempt<100;attempt++){await wait(150);if(await evaluate("document.readyState==='complete'&&typeof state==='object'&&!!document.querySelector('#appVersion')"))break}
  const start=await evaluate("({version:document.querySelector('#appVersion span')?.textContent,overflow:document.documentElement.scrollWidth-window.innerWidth})");
  check('Version 0.50.2 geladen',start.version==='v0.50.2',start.version);check('Kein horizontales Scrollen',start.overflow<=1,`${start.overflow}px`);
  const manual=await evaluate(`(()=>{switchView('recipes');document.querySelector('#toggleRecipeForm').click();const quick=document.querySelector('.manual-recipe-quick');quick?.click();const dialog=document.querySelector('.recipe-edit-dialog');if(!dialog?.open)return{open:false};dialog.querySelector('[name=title]').value='QA Manuelles Rezept';dialog.querySelector('[name=steps]').value='Alles vorbereiten\\nGemeinsam kochen';dialog.querySelector('[data-ingredient-name]').value='Kartoffeln';dialog.querySelector('[data-ingredient-quantity]').value='500 g';dialog.querySelector('[data-add-ingredient]').click();const rows=dialog.querySelectorAll('.manual-ingredient-row');rows[1].querySelector('[data-ingredient-name]').value='Möhren';rows[1].querySelector('[data-ingredient-quantity]').value='3 Stück';dialog.querySelector('form').requestSubmit();const recipe=state.customRecipes.find(item=>item.title==='QA Manuelles Rezept');return{open:true,rows:rows.length,saved:!!recipe,ingredients:recipe?.ingredients?.length||0,persisted:JSON.parse(localStorage.getItem('fami-state')||'{}').customRecipes?.some(item=>item.title==='QA Manuelles Rezept')||false}})()`);
  check('Manuelle Rezeptmaske öffnet',manual.open);check('Zutaten einzeln ergänzbar',manual.rows===2,`${manual.rows} Zeilen`);check('Rezept wird einmal vollständig gespeichert',manual.saved&&manual.ingredients===2&&manual.persisted,`${manual.ingredients} Zutaten`);
  const photo=await evaluate(`(async()=>{switchView('recipes');document.querySelector('#toggleRecipeForm').click();const originalConnected=window.FamiCloud.isConnected,originalAnalyze=window.FamiCloud.analyzeRecipePhoto,uploads=[];window.FamiCloud.isConnected=()=>true;window.FamiCloud.analyzeRecipePhoto=async image=>{uploads.push(image);if(uploads.length===1){const error=new Error('compute resources');error.code='compute_limit';throw error}return{title:'QA Foto-Rezept',imageType:'dish',confidence:.9,portions:4,time:'30 Min.',tags:['Test'],ingredients:[{name:'Kartoffeln',quantity:'500 g'},{name:'Möhren',quantity:'3 Stück'},{name:'Zwiebel',quantity:'1 Stück'}],steps:['Gemüse gründlich vorbereiten.','Alle Zutaten gemeinsam garen.','Abschmecken und servieren.'],nutrition:{kcal:400,protein:20,carbs:50,fat:12}}};const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1800;const context=canvas.getContext('2d');context.fillStyle='#f3e4b5';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='#26342e';context.font='90px sans-serif';context.fillText('Testrezept',180,300);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95)),file=new File([blob],'iphone-foto.jpg',{type:''}),transfer=new DataTransfer();transfer.items.add(file);const input=document.querySelector('#recipePhoto');Object.defineProperty(input,'files',{configurable:true,value:transfer.files});input.dispatchEvent(new Event('change',{bubbles:true}));for(let attempt=0;attempt<100&&document.querySelector('#recipeScanReview').classList.contains('hidden');attempt++)await new Promise(resolve=>setTimeout(resolve,50));const result={review:!document.querySelector('#recipeScanReview').classList.contains('hidden'),title:document.querySelector('#recipeTitle').value,prefix:uploads.at(-1)?.slice(0,23)||'',sizes:uploads.map(item=>item.length),status:document.querySelector('#recipeScanStatus strong').textContent};window.FamiCloud.isConnected=originalConnected;window.FamiCloud.analyzeRecipePhoto=originalAnalyze;return result})()`);
  check('iPhone-Foto ohne MIME-Angabe wird angenommen',photo.review&&photo.title==='QA Foto-Rezept',photo.title);check('Großes Foto wird vor dem Upload als JPEG verkleinert',photo.prefix==='data:image/jpeg;base64,'&&photo.sizes[0]<2_000_000,`${photo.sizes[0]} Zeichen`);check('Rechenlimit löst automatisch kleineren zweiten Versuch aus',photo.sizes.length===2&&photo.sizes[1]<=photo.sizes[0],photo.sizes.join(' → '));
  const batch=await evaluate(`(async()=>{const original=window.FamiCloud.schedulePush,shopping=JSON.parse(JSON.stringify(state.shoppingItems));let calls=0;window.FamiCloud.schedulePush=()=>calls++;addShoppingItems([['Tomaten','2 Stück'],['Nudeln','400 g'],['Käse','100 g']],'QA Rezept');await new Promise(resolve=>queueMicrotask(resolve));const added=state.shoppingItems.filter(item=>item.source?.includes('QA Rezept')).length,batchCalls=calls;state.shoppingItems=shopping;state.customRecipes=state.customRecipes.filter(item=>item.title!=='QA Manuelles Rezept');window.FamiCloud.schedulePush=original;save();return{calls:batchCalls,added}})()`);
  check('Rezeptzutaten lösen nur eine Speicherung aus',batch.calls===1,`${batch.calls} Speichervorgang`);check('Alle Rezeptzutaten werden übernommen',batch.added===3,`${batch.added} Zutaten`);
}finally{
  try{socket?.close()}catch{}browser.kill();qaServer?.close();
}
for(const result of results)console.log(`${result.passed?'PASS':'FAIL'}  ${result.name}${result.detail?` – ${result.detail}`:''}`);
const failed=results.filter(result=>!result.passed);console.log(`Gesamt: ${results.length} | Bestanden: ${results.length-failed.length} | Fehlgeschlagen: ${failed.length}`);if(failed.length)process.exit(1);
