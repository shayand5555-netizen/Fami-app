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

const districtSources = [
  ['Misburg-Anderten','https://www.hannover.de/Kultur-Freizeit/Freizeit-Sport/Freizeiteinrichtungen/Freizeitheime-Stadtteilzentren/B%C3%BCrgerhaus-Misburg/Alle-Veranstaltungen-Kurse'],
  ['Misburg-Anderten','https://www.hannover.de/Leben-in-der-Region-Hannover/B%C3%BCrger-Service/Stadtbezirksportale-Hannover/Stadtbezirk-Misburg-Anderten/Veranstaltungen']
];
for(const [category,url] of districtSources){
  const response=await fetch(url,{headers:{'user-agent':'Fami-Familienkalender/1.0 (+https://shayand5555-netizen.github.io/Fami-app/)'}});
  if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
  const html=await response.text();
  const articles=html.match(/<article class="[^"]*interesting-single[^"]*"[\s\S]*?<\/article>/gi)||[];
  for(const article of articles){
    const title=decode(article.match(/interesting-single__title"[^>]*>([\s\S]*?)<\/h2>/i)?.[1]||'');
    const date=isoDate(decode(article.match(/date__duration"[^>]*>([\s\S]*?)<\/h4>/i)?.[1]||''));
    const venue=decode(article.match(/date__category[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'Misburg-Anderten');
    const path=article.match(/href="([^"]+)"\s*class="content__read-more"/i)?.[1]||'';
    if(!title||!date||!path||/abgesagt|sprach(?:en)?caf[eé]|sprechstund/i.test(title))continue;
    events.push({title,date,venue,category,url:new URL(path,'https://www.hannover.de').href,priority:2});
  }
}

const today=new Date();today.setHours(0,0,0,0);const limit=new Date(today);limit.setDate(limit.getDate()+180);
const addWeekly=(title,start,end,venue,url,excluded=[])=>{for(let date=new Date(`${start}T12:00:00`),last=new Date(`${end}T12:00:00`);date<=last&&date<=limit;date.setDate(date.getDate()+7)){const value=date.toISOString().slice(0,10);if(date>=today&&!excluded.includes(value))events.push({title,date:value,venue,category:'Misburg-Anderten',url,priority:3})}};
addWeekly('Wochenmarkt Misburg','2026-10-10','2026-12-19','Hinter der Alten Burg / Storchendamm, 30629 Hannover','https://www.hannover.de/Kultur-Freizeit/Freizeit-Sport/Shopping-M%C3%A4rkte/Wochen-Bauernm%C3%A4rkte/Wochenm%C3%A4rkte-in-der-Stadt/Wochenm%C3%A4rkte-nach-Stadtteilen/Wochenmarkt-Misburg',['2026-10-31']);
addWeekly('Offener Palettengarten Misburg-Anderten','2026-09-30','2026-12-09','Bürgerhaus Misburg','https://www.hannover.de/Kultur-Freizeit/Freizeit-Sport/Freizeiteinrichtungen/Freizeitheime-Stadtteilzentren/B%C3%BCrgerhaus-Misburg/Alle-Veranstaltungen-Kurse');
const selected=new Map();
for(const event of events.filter(event=>{const date=new Date(`${event.date}T12:00:00`);return date>=today&&date<=limit&&!/abgesagt|sprach(?:en)?caf[eé]|sprechstund/i.test(event.title)})){const key=`${event.title}|${event.date}`;if(!selected.has(key)||(event.priority||0)>(selected.get(key).priority||0))selected.set(key,event)}
const unique=[...selected.values()].map(({priority,...event})=>event).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'de'));
await writeFile('regional-events.json',`${JSON.stringify({updatedAt:new Date().toISOString(),region:'Hannover',source:'Hannover.de',events:unique},null,2)}\n`,'utf8');
console.log(`${unique.length} regionale Termine gespeichert.`);
