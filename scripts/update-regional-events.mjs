import {writeFile} from 'node:fs/promises';

const sources = [
  ['Kinder & Jugendliche','Kinder-Jugendliche'],
  ['Feste & Festivals','Feste-Festivals'],
  ['Kostenlos','Kostenlos'],
  ['Märkte','Märkte']
];
const base = 'https://www.hannover.de/Veranstaltungskalender/';
const decode = value => value
  .replace(/<br\s*\/?>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&apos;/g,"'")
  .replace(/&auml;/g,'ä').replace(/&ouml;/g,'ö').replace(/&uuml;/g,'ü')
  .replace(/&Auml;/g,'Ä').replace(/&Ouml;/g,'Ö').replace(/&Uuml;/g,'Ü').replace(/&szlig;/g,'ß')
  .replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const isoDate = value => {const match=value.match(/(\d{2})\.(\d{2})\.(\d{4})/);return match?`${match[3]}-${match[2]}-${match[1]}`:''};

const events=[];
for(const [category,slug] of sources){
  for(const offset of [0,10,20,30]){
    const url=`${base}${slug}${offset?`/%28offset%29/${offset}`:''}`;
    const response=await fetch(url,{headers:{'user-agent':'Fami-Familienkalender/1.0 (+https://shayand5555-netizen.github.io/Fami-app/)'}});
    if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
    const html=await response.text();
    const articles=html.match(/<article class="[^"]*interesting-single[^"]*"[\s\S]*?<\/article>/gi)||[];
    for(const article of articles){
      const title=decode(article.match(/interesting-single__title"[^>]*>([\s\S]*?)<\/h2>/i)?.[1]||'');
      const date=isoDate(decode(article.match(/date__duration"[^>]*>([\s\S]*?)<\/h4>/i)?.[1]||''));
      const venue=decode(article.match(/date__category[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'Region Hannover');
      const path=article.match(/href="([^"]+)"\s*class="content__read-more"/i)?.[1]||'';
      if(!title||!date||!path)continue;
      events.push({title,date,venue,category,url:new URL(path,'https://www.hannover.de').href});
    }
  }
}

const today=new Date();today.setHours(0,0,0,0);const limit=new Date(today);limit.setDate(limit.getDate()+180);
const unique=[...new Map(events.filter(event=>{const date=new Date(`${event.date}T12:00:00`);return date>=today&&date<=limit}).map(event=>[`${event.title}|${event.date}`,event])).values()].sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de'));
await writeFile('regional-events.json',`${JSON.stringify({updatedAt:new Date().toISOString(),region:'Hannover',source:'Hannover.de',events:unique},null,2)}\n`,'utf8');
console.log(`${unique.length} regionale Termine gespeichert.`);
