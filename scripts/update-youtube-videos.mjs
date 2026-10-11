import {readFile,writeFile} from 'node:fs/promises';

const apiKey='AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const channels=[
  {name:'Schmale Schulter',channelId:'UCSKWJ6rxUpR9PfCcNAxGYQQ',cuisine:'Westlich'},
  {name:'Yummy Gastronomy',channelId:'UCvd5wsIuZzEYA55cZkt7hIQ',cuisine:'Persisch'}
];
const endpoint=`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
const playerEndpoint=`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
const context={client:{clientName:'WEB',clientVersion:'2.20261001.00.00',hl:'de',gl:'DE'}};
let previousRecipes=new Map();try{const previous=JSON.parse(await readFile('recipe-videos.json','utf8'));previousRecipes=new Map((previous.videos||[]).filter(video=>video.recipe).map(video=>[video.id,video.recipe]))}catch{}

async function request(body){
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','user-agent':'Fami-Rezeptkatalog/2.0 (+https://shayand5555-netizen.github.io/Fami-app/)'},body:JSON.stringify({context,...body})});
  if(!response.ok)throw new Error(`YouTube HTTP ${response.status}`);
  return response.json();
}

function visit(value,callback){
  if(!value||typeof value!=='object')return;
  callback(value);
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child,callback);
}

function mealFor(title,channelName){
  const text=title.toLocaleLowerCase('de');
  if(/frühstück|breakfast|brunch|omelett|omelet|pancake|porridge|müsli|granola|صبحانه/.test(text))return 'Frühstück';
  if(/kuchen|cake|dessert|brownie|cookie|torte|muffin|eis|süß|baklava|شیرینی|کیک|دسر/.test(text))return 'Backen & Dessert';
  if(/smoothie|shake|saft|drink|getränk|نوشیدنی/.test(text))return 'Getränke';
  if(/snack|vorspeise|dip|salat|salad|brot|bread|نان|سوپ|soup/.test(text))return 'Snack & Beilage';
  if(/rezept|recipe|kochen|cook|meal|hähnchen|chicken|reis|rice|pasta|nudel|burger|fleisch|fisch|kebab|kabab|خورش|پلو|کباب|غذا/.test(text))return 'Hauptgericht';
  return channelName==='Yummy Gastronomy'?'Hauptgericht':'Weitere';
}

function cuisineFor(title,defaultCuisine){
  const text=title.toLocaleLowerCase('de');
  if(/persisch|iran|iranian|persian|tahdig|ghormeh|fesenjan|zereshk|kabab|kebab|خورش|پلو|کباب|ته دیگ|ایرانی/.test(text))return 'Persisch';
  if(/tandoori|curry|teriyaki|sushi|taco|mexikan|thai|indisch|asian|asiatisch/.test(text))return 'International';
  if(/burger|pizza|pasta|lasagne|schnitzel|auflauf|kartoffel|deutsch|italien|american/.test(text))return 'Westlich';
  return defaultCuisine;
}

function viewCountFrom(metadata){
  const text=metadata.join(' ');const match=text.match(/([\d.,]+)\s*(Mio\.?|Tsd\.?|K|M)?\s*(?:Aufrufe|views)/i);if(!match)return 0;
  let number=Number(match[1].replace(/\.(?=\d{3}(?:\D|$))/g,'').replace(',','.'));const unit=(match[2]||'').toLowerCase();if(unit.startsWith('m'))number*=1e6;else if(unit.startsWith('k')||unit.startsWith('tsd'))number*=1e3;return Math.round(number);
}

function readVideos(data,channel){
  const videos=[];
  visit(data,node=>{
    const card=node.lockupViewModel;if(!card?.contentId||!card?.metadata?.lockupMetadataViewModel)return;
    const title=card.metadata.lockupMetadataViewModel.title?.content?.trim();if(!title)return;
    const metadata=[];visit(card.metadata.lockupMetadataViewModel.metadata,item=>{const content=item?.text?.content;if(content&&!metadata.includes(content))metadata.push(content)});
    videos.push({id:card.contentId,title,url:`https://www.youtube.com/watch?v=${card.contentId}`,image:`https://i.ytimg.com/vi/${card.contentId}/hqdefault.jpg`,meta:metadata.slice(0,3).join(' · '),views:viewCountFrom(metadata),channel:channel.name,channelId:channel.channelId,meal:mealFor(title,channel.name),cuisine:cuisineFor(title,channel.cuisine)});
  });
  return videos;
}

function nextToken(data){let token='';visit(data,node=>{if(node.continuationCommand?.token&&node.continuationCommand?.request==='CONTINUATION_REQUEST_TYPE_BROWSE')token=node.continuationCommand.token});return token}

async function collectChannel(channel){
  const playlistId=`UU${channel.channelId.slice(2)}`;const collected=[];const known=new Set();let data=await request({browseId:`VL${playlistId}`});let pages=0;
  while(data&&pages<50){
    for(const video of readVideos(data,channel))if(!known.has(video.id)){known.add(video.id);collected.push(video)}
    const continuation=nextToken(data);if(!continuation)break;
    await new Promise(resolve=>setTimeout(resolve,180));data=await request({continuation});pages++;
  }
  if(!collected.length)throw new Error(`Keine Videos für ${channel.name} gefunden.`);
  console.log(`${channel.name}: ${collected.length} Videos auf ${pages+1} Seiten.`);return {playlistId,videos:collected};
}

const results=[];for(const channel of channels)results.push({channel,...await collectChannel(channel)});
function cleanLine(line){return line.replace(/^[\s•●▪▫◦*#–—-]+/,'').replace(/\s+/g,' ').trim()}
function extractIngredients(description){
  const lines=description.split(/\r?\n/).map(cleanLine).filter(Boolean);const amount=/(?:[\d۰-۹٠-٩]+[\d۰-۹٠-٩.,/]*\s*(?:g|kg|ml|l|el|tl|stück|stk|tasse|prise|bund|گرم|کیلو|قاشق)|به مقدار)/i;
  return [...new Set(lines.filter(line=>line.length<120&&amount.test(line)&&!/(?:https?:|www\.|@|#|\d+:\d+)/i.test(line)).slice(0,18))];
}
function fallbackIngredients(video){
  const text=video.title.toLocaleLowerCase('de');
  if(/gyros/.test(text))return ['600 g Hähnchenbrust oder Gyrosfleisch','300 g Reis oder Kritharaki','1 Dose Kichererbsen','250 g griechischer Joghurt','1 Gurke','2 Tomaten','1 Zwiebel','2 TL Gyrosgewürz','1 EL Olivenöl'];
  if(/pizza/.test(text))return ['400 g Mehl','250 ml Wasser','1 Päckchen Trockenhefe','300 g passierte Tomaten','250 g Mozzarella','300 g Gemüse oder Proteinbelag','1 EL Olivenöl','Salz und italienische Kräuter nach Geschmack'];
  if(/pasta|nudel|spaghetti|lasagne/.test(text))return ['400 g Nudeln','500 g Gemüse','400 g passierte Tomaten','300 g Hähnchen, Hackfleisch oder Hülsenfrüchte','1 Zwiebel','2 Knoblauchzehen','100 g Käse','1 EL Olivenöl'];
  if(/kuchen|cake|brownie|cookie|muffin|zimtschnecke/.test(text))return ['300 g Mehl oder Haferflocken','3 Eier','250 g Magerquark oder Joghurt','120 ml Milch','80 g Zucker oder Süße nach Wahl','1 Päckchen Backpulver','300 g Obst oder Schokolade','1 TL Vanille oder Zimt'];
  if(/salat|bowl/.test(text))return ['400 g Gemüse oder Blattsalat','300 g Hähnchen, Fisch oder Hülsenfrüchte','250 g Reis, Kartoffeln oder Couscous','1 Gurke','2 Tomaten','200 g Joghurt','1 Zitrone','1 EL Olivenöl'];
  if(/burger|wrap|taco/.test(text))return ['8 Brötchen, Wraps oder Tortillas','600 g Hähnchen, Hackfleisch oder Hülsenfrüchte','200 g Salat','2 Tomaten','1 Gurke','150 g Käse','200 g Joghurt','Gewürze nach Geschmack'];
  if(video.meal==='Frühstück')return ['250 g Haferflocken oder Mehl','3 Eier','400 ml Milch','300 g Joghurt oder Quark','3 Portionen Obst','1 TL Backpulver','Zimt oder Vanille nach Geschmack'];
  if(video.meal==='Backen & Dessert')return ['300 g Mehl','3 Eier','150 g Butter oder Apfelmus','150 ml Milch','100 g Zucker oder Süße nach Wahl','1 Päckchen Backpulver','300 g Obst oder Schokolade'];
  if(video.cuisine==='Persisch')return ['350 g Basmatireis','600 g Hähnchen, Fleisch oder Hülsenfrüchte','2 Zwiebeln','500 g Gemüse oder Kräuter','1 TL Kurkuma','1 Prise Safran','1 Zitrone','2 EL Öl'];
  return ['600 g Proteinquelle nach Wahl','300 g Reis, Nudeln oder Kartoffeln','600 g Gemüse','1 Zwiebel','2 Knoblauchzehen','250 ml Brühe oder Sauce','1 EL Öl','Salz, Pfeffer und Gewürze nach Geschmack'];
}
function generatedSteps(video,ingredients){
  const text=video.title.toLocaleLowerCase('de');const prep=ingredients.length?`Die ${ingredients.length} Zutaten aus der Videobeschreibung abmessen und vorbereiten.`:'Benötigte Zutaten anhand des Originalvideos bereitstellen und vorbereiten.';
  if(/kuchen|cake|brownie|cookie|muffin|شیرینی|کیک|دسر/.test(text))return [prep,'Backofen und Form vorbereiten. Trockene Zutaten gründlich vermischen.','Flüssige Zutaten verrühren, kurz mit den trockenen Zutaten verbinden und mögliche Einlagen unterheben.','Teig gleichmäßig in die Form geben und nach der im Video genannten Temperatur backen.','Garprobe machen, vollständig abkühlen lassen und erst danach portionieren.'];
  if(/suppe|soup|eintopf|خورش|آش/.test(text))return [prep,'Zwiebel, Knoblauch und Gewürze in wenig Öl anschwitzen.','Gemüse und Proteinquelle zugeben, kurz mitrösten und mit der Flüssigkeit auffüllen.','Bei mittlerer Hitze garen, bis alle Zutaten weich und vollständig durchgegart sind.','Konsistenz anpassen, abschmecken und heiß servieren.'];
  if(/reis|rice|پلو|ته دیگ/.test(text))return [prep,'Reis gründlich waschen und nach der im Video gezeigten Methode vorgaren.','Gemüse, Sauce und Proteinquelle getrennt vorbereiten und vollständig durchgaren.','Reis fertig dämpfen oder mit den übrigen Zutaten verbinden.','Abschmecken, kurz ruhen lassen und gemeinsam anrichten.'];
  if(/salat|salad|bowl/.test(text))return [prep,'Alle festen Zutaten waschen, vollständig garen falls nötig und mundgerecht schneiden.','Proteinquelle und Sättigungsbeilage zubereiten und etwas abkühlen lassen.','Dressing separat glatt rühren und kräftig abschmecken.','Alles erst kurz vor dem Servieren mischen und frisch anrichten.'];
  if(/brot|bread|نان/.test(text))return [prep,'Trockene und flüssige Zutaten zu einem gleichmäßigen Teig verbinden.','Teig ausreichend kneten und abgedeckt bis zur passenden Größe ruhen lassen.','Formen und nach der im Video gezeigten Temperatur goldbraun backen.','Vor dem Anschneiden auf einem Gitter auskühlen lassen.'];
  if(/kebab|kabab|کباب|fleisch|chicken|hähnchen|gyros/.test(text))return [prep,'Fleisch beziehungsweise die Proteinquelle würzen oder marinieren.','Beilage und Gemüse parallel nach der im Video gezeigten Methode zubereiten.','Proteinquelle vollständig durchgaren und anschließend kurz ruhen lassen.','Sauce anrühren, alles abschmecken und gemeinsam servieren.'];
  return [prep,'Zwiebel, Gewürze und feste Zutaten zuerst vorbereiten oder anschwitzen.','Übrige Zutaten in der im Originalvideo gezeigten Reihenfolge zugeben.','Alles sorgfältig und vollständig garen; Konsistenz bei Bedarf mit Flüssigkeit anpassen.','Zum Schluss abschmecken, anrichten und die genannten Ruhe- oder Kühlzeiten beachten.'];
}
async function enrichVideo(video){
  try{
    let description='';
    const response=await fetch(playerEndpoint,{method:'POST',headers:{'content-type':'application/json','user-agent':'Fami-Rezeptkatalog/2.0 (+https://shayand5555-netizen.github.io/Fami-app/)'},body:JSON.stringify({context,videoId:video.id})});
    if(response.ok){const data=await response.json();description=data.videoDetails?.shortDescription||''}
    let ingredients=extractIngredients(description),analysisSource=ingredients.length?'description':'catalog';
    if(!ingredients.length){const page=await fetch(`https://www.youtube.com/watch?v=${video.id}&hl=de`,{headers:{'user-agent':'Mozilla/5.0 Fami-Rezeptkatalog/2.0'}});if(page.ok){const html=await page.text(),match=html.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);if(match){description=JSON.parse(`"${match[1]}"`);ingredients=extractIngredients(description);if(ingredients.length)analysisSource='description'}}}
    const previous=previousRecipes.get(video.id);
    if(!ingredients.length&&previous?.ingredients?.length&&previous.analysisSource!=='catalog'){ingredients=previous.ingredients;analysisSource=previous.analysisSource||'description'}
    return {...video,featured:true,description:description.slice(0,6000),recipe:{ingredients,steps:generatedSteps(video,ingredients),analysisSource,sourceType:analysisSource==='description'?'Zutaten aus Videobeschreibung · Ablauf als KI-Entwurf':'Ungeprüfter KI-Entwurf aus Videotitel',notice:analysisSource==='description'?'Zutaten stammen aus der Videobeschreibung; Ablauf, Mengen, Garzeit und Allergene bitte am Originalvideo prüfen.':'Dieser Entwurf wurde noch nicht am Originalvideo bestätigt. Bitte über „Mit KI aus Video verfeinern“ prüfen.'}};
  }catch(error){console.warn(`${video.id}: ${error.message}`);return {...video,featured:true,description:'',recipe:{ingredients:[],steps:generatedSteps(video,[]),analysisSource:'catalog',sourceType:'Ungeprüfter KI-Entwurf aus Videotitel',notice:'Dieser Entwurf wurde noch nicht am Originalvideo bestätigt. Bitte über „Mit KI aus Video verfeinern“ prüfen.'}}}
}
const videos=results.flatMap(result=>result.videos);const featured=[];
for(const result of results){const candidates=result.videos.sort((a,b)=>b.views-a.views);for(let index=0;index<candidates.length;index+=8){featured.push(...await Promise.all(candidates.slice(index,index+8).map(enrichVideo)));await new Promise(resolve=>setTimeout(resolve,100))}}
const featuredById=new Map(featured.map(video=>[video.id,video]));const enrichedVideos=videos.map(video=>{const enriched=featuredById.get(video.id)||video,previous=previousRecipes.get(video.id),base=enriched.recipe||previous||{},foundIngredients=base.ingredients||[],supplements=fallbackIngredients(enriched),ingredients=foundIngredients.length>=5?foundIngredients:[...new Set([...foundIngredients,...supplements])],steps=base.steps?.length>=4?base.steps:generatedSteps(enriched,ingredients);return{...enriched,featured:Boolean(enriched.featured),recipe:{...base,ingredients,steps,analysisSource:base.analysisSource||(foundIngredients.length?'description':'catalog'),sourceType:base.sourceType||(foundIngredients.length?'Zutaten aus Videobeschreibung · Ablauf als KI-Entwurf':'KI-Entwurf aus Videotitel und Kategorie'),notice:base.notice||'Dieser Entwurf wurde automatisch erstellt. Mengen, Garzeit, Temperatur und Allergene bitte mit dem Originalvideo abgleichen.'}}});const payload={updatedAt:new Date().toISOString(),count:videos.length,featuredCount:featured.length,channels:results.map(result=>({name:result.channel.name,channelId:result.channel.channelId,playlistId:result.playlistId,count:result.videos.length,featuredCount:featured.filter(video=>video.channel===result.channel.name).length})),videos:enrichedVideos};
await writeFile('recipe-videos.json',`${JSON.stringify(payload,null,2)}\n`,'utf8');
console.log(`${videos.length} Videos gespeichert, ${featured.length} Top-Rezeptkarten angereichert.`);
