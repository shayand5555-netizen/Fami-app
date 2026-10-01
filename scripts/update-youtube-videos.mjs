import {writeFile} from 'node:fs/promises';

const apiKey='AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const channelId='UCSKWJ6rxUpR9PfCcNAxGYQQ';
const playlistId=`UU${channelId.slice(2)}`;
const endpoint=`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;
const context={client:{clientName:'WEB',clientVersion:'2.20261001.00.00',hl:'de',gl:'DE'}};

async function request(body){
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','user-agent':'Fami-Rezeptkatalog/1.0 (+https://shayand5555-netizen.github.io/Fami-app/)'},body:JSON.stringify({context,...body})});
  if(!response.ok)throw new Error(`YouTube HTTP ${response.status}`);
  return response.json();
}

function visit(value,callback){
  if(!value||typeof value!=='object')return;
  callback(value);
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child,callback);
}

function readVideos(data){
  const videos=[];
  visit(data,node=>{
    const card=node.lockupViewModel;if(!card?.contentId||!card?.metadata?.lockupMetadataViewModel)return;
    const title=card.metadata.lockupMetadataViewModel.title?.content?.trim();if(!title)return;
    const metadata=[];visit(card.metadata.lockupMetadataViewModel.metadata,item=>{const content=item?.text?.content;if(content&&!metadata.includes(content))metadata.push(content)});
    videos.push({id:card.contentId,title,url:`https://www.youtube.com/watch?v=${card.contentId}`,image:`https://i.ytimg.com/vi/${card.contentId}/hqdefault.jpg`,meta:metadata.slice(0,3).join(' · ')});
  });
  return videos;
}

function nextToken(data){let token='';visit(data,node=>{if(node.continuationCommand?.token&&node.continuationCommand?.request==='CONTINUATION_REQUEST_TYPE_BROWSE')token=node.continuationCommand.token});return token}

const collected=[];const known=new Set();let data=await request({browseId:`VL${playlistId}`});let pages=0;
while(data&&pages<30){
  for(const video of readVideos(data))if(!known.has(video.id)){known.add(video.id);collected.push(video)}
  const continuation=nextToken(data);if(!continuation)break;
  await new Promise(resolve=>setTimeout(resolve,180));data=await request({continuation});pages++;
}
if(collected.length<100)throw new Error(`Nur ${collected.length} Videos gefunden – Katalog wird nicht überschrieben.`);
await writeFile('schmale-schulter-videos.json',`${JSON.stringify({updatedAt:new Date().toISOString(),channel:'Schmale Schulter',channelId,playlistId,count:collected.length,videos:collected},null,2)}\n`,'utf8');
console.log(`${collected.length} einzelne Videos auf ${pages+1} Seiten gespeichert.`);
