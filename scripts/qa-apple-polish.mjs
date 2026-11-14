import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');

test('Version und Offline-Dateien sind einheitlich',()=>{
  assert.match(html,/v0\.51\.1/);
  assert.match(worker,/fami-v0\.51\.1/);
  assert.doesNotMatch(app,/0\.50\.6/);
});

test('Statusmeldungen und globale Suche sind zugänglich ausgezeichnet',()=>{
  assert.match(html,/id="toast"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(html,/id="globalSearchDialog"[^>]+aria-labelledby="globalSearchTitle"/);
  assert.match(html,/id="globalSearchResults"[^>]+aria-live="polite"/);
});

test('Apple-Bedienhilfen und Systemdarstellung sind vorhanden',()=>{
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/prefers-color-scheme:dark/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/min-width:44px/);
  assert.match(css,/recipe-import:not\(\.hidden\)\{position:fixed/);
});

test('Globale Suche deckt alle Familienbereiche und Umlaute ab',()=>{
  const start=app.indexOf('let globalSearchMatches=');
  const end=app.indexOf('function rememberUndo(',start);
  assert.ok(start>=0&&end>start);
  const state={
    events:[{id:'e1',title:'Zahnarzt',date:'2026-11-14',time:'10:00',place:'Hannover',people:['Selina']}],
    tasks:[{id:'t1',title:'Müll rausbringen',done:false,dateLabel:'Heute',person:'Shayan'}],
    shoppingItems:[{id:'s1',name:'Äpfel',quantity:'2 kg',done:false,category:'Obst'}],
    mealPlan:[{id:'m1',title:'Protein Pizza',date:'2026-11-15',meal:'Abendessen'}],
    customRecipes:[{id:'r1',title:'Gemüsesuppe',source:'Familie',ingredients:[['Möhre','2']]}],
    cleaningRules:[{id:'c1',title:'Staubsaugen',room:'Wohnzimmer',intervalDays:7,assignedTo:'Selina'}],
    currentUser:'Shayan'
  };
  const context=vm.createContext({state,recipes:[],family:['Shayan','Selina'],window:{},prettyDate:value=>value,recipeFilterText:item=>`${item.title} ${(item.ingredients||[]).flat().join(' ')}`,escapeHtml:String,CSS:{escape:String},setTimeout,$:()=>null,$$:()=>[],switchView(){},openEventEditor(){},openTaskEditor(){},openRecipeEditor(){},openPlannedMealRecipe(){},Event});
  vm.runInContext(`${app.slice(start,end)};globalThis.qa={normalizedSearchText,globalSearchEntries}`,context);
  const entries=context.qa.globalSearchEntries();
  assert.deepEqual([...new Set(entries.map(item=>item.kind))].sort(),['cleaning','event','family','meal','recipe','shopping','task']);
  assert.equal(context.qa.normalizedSearchText('Äpfel & Gemüse'),'apfel & gemuse');
});
