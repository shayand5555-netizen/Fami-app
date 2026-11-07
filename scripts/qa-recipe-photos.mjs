import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const scanner=fs.readFileSync(new URL('../recipe-scanner.js',import.meta.url),'utf8');
const imageCode=source.slice(source.indexOf('function recipePhotoType('),source.indexOf('async function deleteRecipe('));

function setup(){
  const blobs=[],removed=[],local=[],remote=[],recipe={id:'r',title:'Testrezept',custom:true,hasPhoto:false};
  const c=vm.createContext({
    Blob,File,Uint8Array,atob,Date,console,
    state:{customRecipes:[recipe],recipePhotoIds:[],videoPhotoIds:[],videoRecipeDrafts:[]},
    storedRecipeImageUrls:new Map(),saves:0,lookups:[],removed,blobs,
    window:{FamiRecipeScanner:{preparePhoto:async()=>new File(['jpeg'],'rezept.jpg',{type:'image/jpeg'})}},
    allRecipes:()=>c.state.customRecipes,touch:item=>{item.updatedAt=new Date().toISOString();return item},save:()=>c.saves++,
    getLocalAttachments:async entity=>{c.lookups.push(`local:${entity}`);return local.filter(file=>file.entity===entity)},
    getAttachments:async entity=>{c.lookups.push(`all:${entity}`);return [...local,...remote].filter(file=>file.entity===entity)},
    storeAttachments:async(_entity,_files,options)=>{c.options=options;return{local:true,cloud:false}},
    removeAttachment:async file=>removed.push(file.id),
    URL:{createObjectURL:blob=>{blobs.push(blob);return`blob:test-${blobs.length}`},revokeObjectURL:()=>{}},
    $$:()=>[{dataset:{recipeImage:'r'}}],$:()=>null
  });
  vm.runInContext(imageCode,c);
  c.local=local;c.remote=remote;c.run=expression=>vm.runInContext(expression,c);
  return c;
}

test('Fotos ohne MIME-Angabe werden anhand von Dateiname oder Blob erkannt',()=>{
  const c=setup();
  assert.equal(c.run("recipePhotoType({name:'IMG_1234.JPG',type:''})"),'image/jpeg');
  assert.equal(c.run("recipePhotoType({name:'foto',blob:new Blob(['bild'],{type:'image/png'})})"),'image/png');
  assert.equal(c.run("recipePhotoType({name:'foto.heic',type:'application/octet-stream'})"),'image/heic');
  assert.equal(c.run("recipePhotoType({name:'rezept.pdf',type:'application/pdf'})"),'');
});

test('Vorhandene lokale Fotos erscheinen sofort ohne Cloud-Abfrage',async()=>{
  const c=setup();c.local.push({id:'old',entity:'recipe-cover:r',name:'foto.JPG',type:'',blob:new Blob(['bild'])});
  const url=await c.run("storedRecipeImageUrl('r','recipe-cover:r')");
  assert.equal(url,'blob:test-1');assert.equal(c.blobs[0].type,'image/jpeg');
  assert.deepEqual(c.lookups,['local:recipe-cover:r']);
  assert.equal(await c.run("storedRecipeImageUrl('r','recipe-cover:r')"),url);assert.equal(c.lookups.length,1);
});

test('Alte Rezept-Anhänge werden auch neben einem Nicht-Bild-Anhang gefunden',async()=>{
  const c=setup();c.remote.push({id:'cloud:pdf',entity:'recipe-cover:r',name:'rezept.pdf',type:'application/pdf',blob:new Blob(['pdf'])});
  c.remote.push({id:'cloud:photo',entity:'recipe:r',name:'foto.png',type:'image/png',blob:new Blob(['png'])});
  assert.equal(await c.run("storedRecipeImageUrl('r','recipe-cover:r')"),'blob:test-1');assert.equal(c.blobs[0].type,'image/png');
});

test('Sichtbare eigene Rezepte werden auch ohne Foto-Markierung nachgeladen',async()=>{
  const c=setup();c.run('applyStoredRecipeImage=async()=>true');
  await c.run('loadRecipeImages({})');
  assert.deepEqual(c.state.recipePhotoIds,['r']);assert.equal(c.state.customRecipes[0].hasPhoto,true);assert.ok(c.state.customRecipes[0].updatedAt);assert.equal(c.saves,1);
  await c.run('loadRecipeImages({})');assert.equal(c.saves,1);
});

test('Fehlende Fotos werden nicht als gespeichert markiert',async()=>{
  const c=setup();c.run('applyStoredRecipeImage=async()=>false');
  await c.run('loadRecipeImages({})');assert.equal(c.state.recipePhotoIds.length,0);assert.equal(c.state.customRecipes[0].hasPhoto,false);assert.equal(c.saves,0);
});

test('Ein Fehler beim Vorbereiten oder Speichern erhält das alte Foto',async()=>{
  for(const stage of ['prepare','store']){
    const c=setup();c.local.push({id:'old',entity:'recipe-cover:r',name:'alt.jpg',blob:new Blob(['old'],{type:'image/jpeg'})});
    if(stage==='prepare')c.window.FamiRecipeScanner.preparePhoto=async()=>{throw new Error('Vorbereitung fehlgeschlagen')};
    else c.storeAttachments=async()=>{throw new Error('Speicher voll')};
    await assert.rejects(c.run("saveRecipeCover('r',new File(['bild'],'neu.jpg'))"));
    assert.equal(c.removed.length,0);assert.equal(c.state.customRecipes[0].hasPhoto,false);assert.equal(c.saves,0);
  }
});

test('Lokales Ersatzfoto löscht kein vorhandenes Cloud-Foto',async()=>{
  const c=setup();c.local.push({id:'old-local',entity:'recipe-cover:r'});c.remote.push({id:'cloud:old',cloud:true,entity:'recipe-cover:r'});
  await c.run("saveRecipeCover('r',new File(['bild'],'neu.jpg'))");
  assert.equal(c.options.keepLocal,true);assert.deepEqual(c.removed,['old-local']);assert.equal(c.state.customRecipes[0].hasPhoto,true);assert.ok(c.state.customRecipes[0].photoUpdatedAt);assert.equal(c.state.recipePhotoIds[0],'r');assert.equal(c.saves,1);
});

test('Erfolgreicher Upload ersetzt alte Fotos erst nach gesicherter Speicherung',async()=>{
  const c=setup();c.local.push({id:'old-local',entity:'recipe-cover:r'});c.remote.push({id:'cloud:old',cloud:true,entity:'recipe-cover:r'});
  const order=[];c.storeAttachments=async()=>{order.push('saved');return{cloud:true,local:true}};c.removeAttachment=async file=>order.push(file.id);
  await c.run("saveRecipeCover('r',new File(['bild'],'neu.jpg'),{save:false})");
  assert.deepEqual(order,['saved','old-local','cloud:old']);assert.equal(c.saves,0);assert.equal(c.blobs[0].type,'image/jpeg');
});

test('Ein nicht lesbares Foto blockiert das Nachladen nicht dauerhaft',{timeout:1000},async()=>{
  const c=setup();c.local.push({id:'bad',entity:'recipe-cover:r',name:'bad.jpg',blob:new Blob(['kaputt'])});
  const host={isConnected:true,querySelector:()=>null,prepend:()=>assert.fail('Kaputtes Foto darf nicht eingesetzt werden')};
  c.$=()=>host;c.document={createElement:()=>({decode:async()=>{throw new Error('kaputtes Bild')},complete:false,naturalWidth:0})};
  assert.equal(await c.run("applyStoredRecipeImage({},'r','recipe-cover:r','Test')"),false);
});

test('Die Fotoaufbereitung liefert für Kamera- und HEIC-Namen ein typisiertes JPEG',async()=>{
  const supported=scanner.slice(scanner.indexOf('  const supportedPhoto = '),scanner.indexOf('  const blobDataUrl = '));
  const prepare=scanner.slice(scanner.indexOf('  async function preparePhoto('),scanner.indexOf('  window.FamiRecipeScanner = '));
  const c=vm.createContext({File,Uint8Array,atob,Date,imageDataUrl:async()=>`data:image/jpeg;base64,${Buffer.from('jpeg-test').toString('base64')}`});
  vm.runInContext(supported+prepare,c);
  for(const name of ['IMG_1234.JPG','IMG_1234.HEIC']){
    c.file=new File(['original'],name,{type:''});const result=await vm.runInContext('preparePhoto(file)',c);
    assert.equal(result.type,'image/jpeg');assert.equal(result.name,'IMG_1234.jpg');assert.equal(await result.text(),'jpeg-test');
  }
  c.file=new File(['pdf'],'rezept.pdf',{type:'application/pdf'});await assert.rejects(vm.runInContext('preparePhoto(file)',c));
});
