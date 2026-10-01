import {writeFile} from 'node:fs/promises';

const apiKey='AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const channels=[
  {name:'Schmale Schulter',channelId:'UCSKWJ6rxUpR9PfCcNAxGYQQ',cuisine:'Westlich'},
  {name:'Yummy Gastronomy',channelId:'UCvd5wsIuZzEYA55cZkt7hIQ',cuisine:'Persisch'}
];
const endpoint=`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
const playerEndpoint=`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
const context={client:{clientName:'WEB',clientVersion:'2.20261001.00.00',hl:'de',gl:'DE'}};

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
  const lines=description.split(/\r?\n/).map(cleanLine).filter(Boolean);const amount=/(?:\d+[\d.,/]*\s*(?:g|kg|ml|l|el|tl|stück|stk|tasse|prise|bund)|به مقدار|گرم|کیلو|قاشق)/i;
  return [...new Set(lines.filter(line=>line.length<120&&amount.test(line)&&!/(?:https?:|www\.|@|#|\d+:\d+)/i.test(line)).slice(0,18))];
}
function generatedSteps(video,ingredients){
  const text=video.title.toLocaleLowerCase('de');const prep=ingredients.length?`Die ${ingredients.length} Zutaten aus der Videobeschreibung abmessen und vorbereiten.`:'Benötigte Zutaten anhand des Originalvideos bereitstellen und vorbereiten.';
  if(/kuchen|cake|brownie|cookie|muffin|شیرینی|کیک|دسر/.test(text))return [prep,'Trockene und flüssige Bestandteile getrennt vermengen und anschließend zu einem gleichmäßigen Teig verbinden.','In die passende Form geben und backen, bis das Gebäck gar ist. Vor dem Portionieren abkühlen lassen.'];
  if(/suppe|soup|eintopf|خورش|آش/.test(text))return [prep,'Aromatische Zutaten zuerst anschwitzen, anschließend die übrigen Zutaten und Flüssigkeit zugeben.','Bei mittlerer Hitze garen, bis alles weich ist. Abschmecken und heiß servieren.'];
  if(/reis|rice|پلو|ته دیگ/.test(text))return [prep,'Reis waschen und nach der im Video gezeigten Methode garen.','Beilagen, Gemüse oder Protein separat zubereiten, anschließend gemeinsam anrichten und abschmecken.'];
  if(/salat|salad/.test(text))return [prep,'Alle festen Zutaten mundgerecht schneiden und in einer großen Schüssel mischen.','Dressing separat verrühren, kurz vor dem Servieren unterheben und abschmecken.'];
  if(/brot|bread|نان/.test(text))return [prep,'Zutaten zu einem gleichmäßigen Teig verbinden und ausreichend ruhen lassen.','Formen und nach der im Video gezeigten Temperatur goldbraun backen. Vor dem Anschneiden abkühlen lassen.'];
  if(/kebab|kabab|کباب|fleisch|chicken|hähnchen/.test(text))return [prep,'Fleisch beziehungsweise die Proteinquelle würzen oder marinieren.','Nach der im Video gezeigten Methode braten, grillen oder garen und mit den vorbereiteten Beilagen servieren.'];
  return [prep,'Zutaten in der im Originalvideo gezeigten Reihenfolge verarbeiten und sorgfältig garen.','Zum Schluss abschmecken, anrichten und die im Video genannten Ruhe- oder Kühlzeiten beachten.'];
}
async function enrichVideo(video){
  try{const response=await fetch(playerEndpoint,{method:'POST',headers:{'content-type':'application/json','user-agent':'Fami-Rezeptkatalog/2.0 (+https://shayand5555-netizen.github.io/Fami-app/)'},body:JSON.stringify({context,videoId:video.id})});if(!response.ok)throw new Error(`Player ${response.status}`);const data=await response.json();const description=data.videoDetails?.shortDescription||'';const ingredients=extractIngredients(description);return {...video,featured:true,recipe:{ingredients,steps:generatedSteps(video,ingredients),sourceType:ingredients.length?'Zutaten aus Videobeschreibung · Ablauf als KI-Entwurf':'KI-Entwurf aus Videotitel',notice:'Mengen, Garzeit, Temperatur und Allergene bitte mit dem Originalvideo abgleichen.'}}}catch(error){console.warn(`${video.id}: ${error.message}`);return {...video,featured:true,recipe:{ingredients:[],steps:generatedSteps(video,[]),sourceType:'KI-Entwurf aus Videotitel',notice:'Mengen, Garzeit, Temperatur und Allergene bitte mit dem Originalvideo abgleichen.'}}}
}
const videos=results.flatMap(result=>result.videos);const featured=[];
for(const result of results){const candidates=result.videos.filter(video=>video.meal!=='Weitere').sort((a,b)=>b.views-a.views).slice(0,100);for(let index=0;index<candidates.length;index+=8){featured.push(...await Promise.all(candidates.slice(index,index+8).map(enrichVideo)));await new Promise(resolve=>setTimeout(resolve,100))}}
const featuredById=new Map(featured.map(video=>[video.id,video]));const enrichedVideos=videos.map(video=>featuredById.get(video.id)||video);const payload={updatedAt:new Date().toISOString(),count:videos.length,featuredCount:featured.length,channels:results.map(result=>({name:result.channel.name,channelId:result.channel.channelId,playlistId:result.playlistId,count:result.videos.length,featuredCount:featured.filter(video=>video.channel===result.channel.name).length})),videos:enrichedVideos};
await writeFile('recipe-videos.json',`${JSON.stringify(payload,null,2)}\n`,'utf8');
console.log(`${videos.length} Videos gespeichert, ${featured.length} Top-Rezeptkarten angereichert.`);
