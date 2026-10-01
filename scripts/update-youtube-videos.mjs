import {writeFile} from 'node:fs/promises';

const apiKey='AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const channels=[
  {name:'Schmale Schulter',channelId:'UCSKWJ6rxUpR9PfCcNAxGYQQ',cuisine:'Westlich'},
  {name:'Yummy Gastronomy',channelId:'UCvd5wsIuZzEYA55cZkt7hIQ',cuisine:'Persisch'}
];
const endpoint=`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
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

function mealFor(title){
  const text=title.toLocaleLowerCase('de');
  if(/frühstück|breakfast|brunch|omelett|omelet|pancake|porridge|müsli|granola|صبحانه/.test(text))return 'Frühstück';
  if(/kuchen|cake|dessert|brownie|cookie|torte|muffin|eis|süß|baklava|شیرینی|کیک|دسر/.test(text))return 'Backen & Dessert';
  if(/smoothie|shake|saft|drink|getränk|نوشیدنی/.test(text))return 'Getränke';
  if(/snack|vorspeise|dip|salat|salad|brot|bread|نان|سوپ|soup/.test(text))return 'Snack & Beilage';
  if(/rezept|recipe|kochen|cook|meal|hähnchen|chicken|reis|rice|pasta|nudel|burger|fleisch|fisch|kebab|kabab|خورش|پلو|کباب|غذا/.test(text))return 'Hauptgericht';
  return 'Weitere';
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
    videos.push({id:card.contentId,title,url:`https://www.youtube.com/watch?v=${card.contentId}`,image:`https://i.ytimg.com/vi/${card.contentId}/hqdefault.jpg`,meta:metadata.slice(0,3).join(' · '),views:viewCountFrom(metadata),channel:channel.name,channelId:channel.channelId,meal:mealFor(title),cuisine:cuisineFor(title,channel.cuisine)});
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
const videos=results.flatMap(result=>result.videos);const payload={updatedAt:new Date().toISOString(),count:videos.length,channels:results.map(result=>({name:result.channel.name,channelId:result.channel.channelId,playlistId:result.playlistId,count:result.videos.length})),videos};
await writeFile('recipe-videos.json',`${JSON.stringify(payload,null,2)}\n`,'utf8');
console.log(`${videos.length} einzelne Videos aus ${channels.length} Kanälen gespeichert.`);
