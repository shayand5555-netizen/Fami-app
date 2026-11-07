import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const section=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const code=[
  section('function ingredientParts(', 'function smartRecipeCandidates('),
  section('const shoppingCategoryOrder=', 'function addRecipeToShopping('),
  section('function repairSharedCollections(', 'function recordRuntimeIssue('),
  section('function mergeSharedCollection(', 'function setDeviceUser('),
  section('function moveBoughtFoodToPantry(', 'function renderPantryManager(')
].join('\n');

function setup(shoppingItems=[]){
  const context=vm.createContext({
    state:{shoppingItems,pantryItems:[],mealPlan:[],deletedIds:[],trashItems:[],familyMembers:['Test'],currentUser:'Test'},
    saves:0,queued:[],badge:{textContent:''},
    $:()=>null,$$:()=>[],queueMicrotask:fn=>context.queued.push(fn),
    touch:item=>{item.updatedAt=new Date().toISOString();return item},
    save:()=>{context.saves++},recordActivity:()=>{},toast:()=>{},switchView:()=>{},offerUndo:()=>{},
    rememberUndo:()=>({}),currentView:'home',
    moveToTrash:(_collection,item)=>{context.state.deletedIds.push(item.id);context.state.trashItems.push({item:{...item}})},
    mealWeekStart:()=>new Date('2026-11-09T12:00:00Z'),
    isoDate:date=>date.toISOString().slice(0,10),
    addDays:(date,days)=>new Date(date.getTime()+days*86400000),
    recipeForMeal:meal=>meal.recipeSnapshot
  });
  vm.runInContext(code,context);
  context.run=expression=>vm.runInContext(expression,context);
  context.json=expression=>JSON.parse(JSON.stringify(context.run(expression)));
  return context;
}

test('Screenshot: normale und vertauschte Hähnchenbrust ergeben eine Zeile mit 550 g',()=>{
  const c=setup([{id:'a',name:'Hähnchenbrust',quantity:'150 g',done:false},{id:'b',name:'400 g',quantity:'Hähnchenbrust',category:'Sonstiges',done:false}]);
  c.run('repairSharedCollections()');
  const rows=c.json('shoppingItemGroups()');
  assert.equal(rows.length,1);assert.equal(rows[0].name,'Hähnchenbrust');assert.equal(rows[0].quantity,'550 g');assert.equal(rows[0].category,'Fleisch, Fisch & Veggie');
  assert.deepEqual(c.json('state.shoppingItems.map(item=>item.id)'),['a','b']);
  assert.equal(c.state.shoppingItems[1].amount,400);assert.equal(c.state.shoppingItems[1].unit,'g');
});

test('Alle Eingabeformen verwenden denselben Standard',()=>{
  const c=setup();
  for(const value of [
    '400 g Hähnchenbrust','Hähnchenbrust 400 g','Hähnchenbrust | 400 g','400 g | Hähnchenbrust',
    ['Hähnchenbrust','400 g'],['400 g','Hähnchenbrust'],['400 g Hähnchenbrust','1'],
    {name:'400 g',quantity:'Hähnchenbrust'},{name:'Hähnchenbrust',amount:400,unit:'g'},
    {name:'Hähnchenbrust',quantity:400,unit:'g'}
  ]){
    c.input=value;const item=c.json('normalizeShoppingIngredient(input)');
    assert.equal(item.name,'Hähnchenbrust',JSON.stringify(value));assert.equal(item.quantity,'400 g');assert.equal(item.amount,400);assert.equal(item.unit,'g');
  }
});

test('Schreibweisen werden erkannt, andere Produkte und Zubereitungsarten bleiben getrennt',()=>{
  const c=setup();
  assert.equal(c.run("shoppingIngredientKey('  HAeHNCHENBRUSTFILET  ')"),c.run("shoppingIngredientKey('Hähnchenbrust')"));
  assert.equal(c.run("shoppingIngredientKey('Karotten')"),c.run("shoppingIngredientKey('Möhren')"));
  for(const name of ['Hähnchen','Hähnchenschenkel','Hähnchenbrust gegart','Panierte Hähnchenbrust']){
    c.input=name;assert.notEqual(c.run('shoppingIngredientKey(input)'),c.run("shoppingIngredientKey('Hähnchenbrust')"));
  }
  assert.notEqual(c.run("shoppingIngredientKey('Milch laktosefrei')"),c.run("shoppingIngredientKey('Milch')"));
});

test('Gleiche Mengen aus zwei Rezepten werden addiert',()=>{
  const c=setup();
  c.run("addShoppingItems([['Hähnchenbrust','150 g']],'Rezept A');addShoppingItems([['Hähnchenbrust','150 g']],'Rezept B')");
  assert.equal(c.state.shoppingItems.length,1);assert.equal(c.state.shoppingItems[0].quantity,'300 g');assert.equal(c.state.shoppingItems[0].source,'Rezept A, Rezept B');
  c.run("addShoppingItem('Hähnchenbrust','150 g','Manuell');addShoppingItem('Hähnchenbrust','150 g','Manuell')");
  assert.equal(c.state.shoppingItems[0].quantity,'600 g');
});

test('Ein Rezept-Batch wird einmal gespeichert und führt alle Wege zusammen',()=>{
  const c=setup();
  c.run("addShoppingItems([['150 g','Hähnchenbrust'],{name:'haehnchenbrustfilet',quantity:'0,4 kg'}],'Import')");
  assert.equal(c.state.shoppingItems.length,1);assert.equal(c.state.shoppingItems[0].quantity,'550 g');assert.equal(c.saves,1);assert.equal(c.queued.length,0);
  c.run("addShoppingItem('Hähnchenbrust','150 g')");
  assert.equal(c.state.shoppingItems[0].quantity,'700 g');assert.equal(c.queued.length,1);
});

test('Kompatible Einheiten und bereits kombinierte Mengen werden gerechnet',()=>{
  const c=setup();
  assert.equal(c.run("formatCombinedQuantity(['500 g','0,5 kg'])"),'1 kg');
  assert.equal(c.run("formatCombinedQuantity(['0,5 l','250 ml','25 cl'])"),'1 l');
  assert.equal(c.run("formatCombinedQuantity(['100 g + 1 EL','200 g','2 EL'])"),'300 g + 3 EL');
  assert.equal(c.run("formatCombinedQuantity(['1 Dose','2 Dosen'])"),'3 Dosen');
  assert.equal(c.run("formatCombinedQuantity(['1 EL','10 g'])"),'1 EL + 10 g');
});

test('Brüche und Dezimalkomma werden zuverlässig gelesen',()=>{
  const c=setup();
  assert.equal(c.run("formatCombinedQuantity(['1 ½ kg','1/2 kg'])"),'2 kg');
  assert.equal(c.run("formatCombinedQuantity(['¼ TL','0,75 TL'])"),'1 TL');
  assert.equal(c.run("normalizeShoppingIngredient('1/2 kg Hähnchenbrust').quantity"),'500 g');
  assert.equal(c.run("parsedQuantity('1/0 g')"),null);
});

test('Fehlende und nicht umrechenbare Mengen werden nicht geraten',()=>{
  const c=setup();
  assert.equal(c.run("normalizeShoppingIngredient(['Parmesan','1']).quantity"),'1');
  assert.equal(c.run("normalizeShoppingIngredient(['Parmesan','1']).unit"),'');
  assert.equal(c.run("formatCombinedQuantity(['75 g','1'])"),'75 g + 1');
  assert.equal(c.run("formatCombinedQuantity(['1 Palette','30 ml'])"),'30 ml + 1 Palette');
  assert.equal(c.run("formatCombinedQuantity(['150 g','nach Bedarf'])"),'150 g + nach Bedarf');
  assert.equal(c.run("normalizeShoppingIngredient(['50 g','Honig + Walnüsse + Whey']).name"),'Honig + Walnüsse + Whey');
  assert.equal(c.run("normalizeShoppingIngredient(['Salz, Cayennepfeffer, Paprika','nach Geschmack']).quantity"),'nach Geschmack');
});

test('Bereinigung ist wiederholbar, ohne Mengen oder IDs zu verlieren',()=>{
  const c=setup([{id:'a',name:'150 g',quantity:'Hähnchenbrust',done:false},{id:'b',name:'Hähnchenbrustfilet',quantity:'400 g',done:false}]);
  c.run('repairSharedCollections()');const once=JSON.stringify(c.state);
  const result=c.json('repairSharedCollections()');assert.equal(result.repaired,0);assert.equal(JSON.stringify(c.state),once);
  assert.equal(c.run('shoppingItemGroups()[0].quantity'),'550 g');assert.equal(c.state.deletedIds.length,0);
});

test('Ein alter Cloud-Stand zählt bestehende IDs nicht doppelt',()=>{
  const items=[{id:'a',name:'Hähnchenbrust',quantity:'150 g',updatedAt:'2020-01-01',done:false},{id:'b',name:'400 g',quantity:'Hähnchenbrust',updatedAt:'2020-01-01',done:false}];
  const remote=JSON.parse(JSON.stringify(items)),c=setup(items);c.remote=remote;
  c.run('repairSharedCollections();state.shoppingItems=mergeSharedCollection(state.shoppingItems,remote,state.deletedIds);repairSharedCollections()');
  assert.equal(c.state.shoppingItems.length,2);assert.equal(c.run('shoppingItemGroups()[0].quantity'),'550 g');
});

test('Offene und erledigte Käufe werden getrennt behandelt',()=>{
  const c=setup([{id:'a',name:'Hähnchenbrust',quantity:'400 g',done:true}]);
  c.run("addShoppingItems([['Hähnchenbrust','150 g']])");
  const groups=c.json('shoppingItemGroups()');assert.equal(groups.length,2);assert.equal(groups.find(item=>item.done).quantity,'400 g');assert.equal(groups.find(item=>!item.done).quantity,'150 g');
});

test('Bekannte Produkte bekommen feste Kategorien',()=>{
  const c=setup();
  for(const [name,category] of [['Minze','Obst & Gemüse'],['Gouda','Kühlung & Molkerei'],['Mozarella','Kühlung & Molkerei'],['Sucuk','Fleisch, Fisch & Veggie'],['270 g Haferflocken','Frühstück & Vorrat']]){
    c.input=name;assert.equal(c.run('normalizeShoppingIngredient(input).category'),category,name);
  }
});

test('Wocheneinkauf bündelt Formate und zieht Vorräte ab',()=>{
  const c=setup();
  c.state.pantryItems=[{id:'p',name:'Haehnchenbrustfilet',quantity:'300 g'}];
  c.state.mealPlan=[
    {date:'2026-11-09',title:'A',recipeSnapshot:{ingredients:[['150 g','Hähnchenbrust']]}},
    {date:'2026-11-10',title:'B',recipeSnapshot:{ingredients:[['Hähnchenbrust','400 g']]}}
  ];
  c.run('addMealWeekToShopping()');
  assert.equal(c.state.shoppingItems.length,1);assert.equal(c.state.shoppingItems[0].quantity,'250 g');assert.equal(c.state.shoppingItems[0].mealWeek,'2026-11-09');
  assert.equal(c.state.shoppingItems[0].category,'Fleisch, Fisch & Veggie');
  c.run('addMealWeekToShopping()');assert.equal(c.run('shoppingItemGroups()[0].quantity'),'250 g');
});

test('Zusammengefasste gekaufte Mengen werden vollständig in den Vorrat übertragen',()=>{
  const c=setup([{id:'a',name:'Hähnchenbrust',quantity:'150 g',done:true},{id:'b',name:'400 g',quantity:'Hähnchenbrust',done:true},{id:'c',name:'Seife',quantity:'1',done:true}]);
  c.state.pantryItems=[{id:'p',name:'Hähnchenbrust',quantity:'100 g',bestBefore:'2026-12-01'}];
  c.run('moveBoughtFoodToPantry()');
  assert.equal(c.state.pantryItems.length,1);assert.equal(c.state.pantryItems[0].quantity,'650 g');assert.equal(c.state.pantryItems[0].bestBefore,'2026-12-01');
  assert.deepEqual(c.state.shoppingItems.map(item=>item.id),['c']);assert.deepEqual(c.state.deletedIds,['a','b']);
});

test('Nullmengen bleiben erhalten, leere Artikel werden verworfen',()=>{
  const c=setup();assert.equal(c.run("normalizeShoppingIngredient({name:'Reis',quantity:0,unit:'g'}).quantity"),'0 g');
  assert.equal(c.run("addShoppingItem('  ','150 g')"),false);assert.equal(c.state.shoppingItems.length,0);assert.equal(c.queued.length,0);
});
