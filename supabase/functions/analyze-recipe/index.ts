const corsHeaders = {
  'access-control-allow-origin':'*',
  'access-control-allow-headers':'authorization, x-client-info, apikey, content-type',
  'content-type':'application/json; charset=utf-8'
};

const reply = (body:unknown, status=200) => new Response(JSON.stringify(body), {status,headers:corsHeaders});

Deno.serve(async request => {
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  try{
    const key=Deno.env.get('GEMINI_API_KEY');
    if(!key)throw new Error('GEMINI_API_KEY ist in Supabase noch nicht eingerichtet.');
    const input=await request.json();
    const mode=input?.mode==='video'?'video':input?.mode==='url'?'url':'image';
    const video=input?.video||{};
    const image=input?.image;
    const pageUrl=String(input?.url||'').trim();
    let mimeType='',imageData='';
    if(mode==='image'){
      if(typeof image!=='string'||!image.startsWith('data:image/'))return reply({error:'Ungültiges Bild.'},400);
      if(image.length>8_000_000)return reply({error:'Das Foto ist zu groß.'},413);
      const imageMatch=image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
      if(!imageMatch)return reply({error:'Das Bildformat wird nicht unterstützt.'},400);
      [,mimeType,imageData]=imageMatch;
    }else if(mode==='video'&&(typeof video?.title!=='string'||!video.title.trim()))return reply({error:'Der Videotitel fehlt.'},400);
    else if(mode==='url'){
      let parsed:URL;try{parsed=new URL(pageUrl)}catch{return reply({error:'Der Rezeptlink ist ungültig.'},400)}
      if(parsed.protocol!=='https:'||/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(parsed.hostname))return reply({error:'Bitte einen öffentlichen HTTPS-Rezeptlink verwenden.'},400);
    }
    const imagePrompt=`Analysiere das Foto für eine deutsche Familien-Rezept-App. Es kann entweder eine fotografierte Rezeptseite oder ein fertiges Gericht zeigen.
- Bei einer Rezeptseite: lies Titel, Zutaten, Mengen und Schritte möglichst genau ab.
- Bei einem fertigen Gericht: erkenne das wahrscheinlichste Gericht und erstelle einen plausiblen, klar als Schätzung behandelbaren Rezeptvorschlag für vier Portionen.
- Erfinde keine ungewöhnlichen Zutaten. Nutze deutsche Bezeichnungen und metrische Mengen.
- Schätze Nährwerte pro Portion realistisch. Sie sind nur Orientierungswerte.
- confidence liegt zwischen 0 und 1. Bei unklarem Foto niedrig ansetzen.
- imageType ist recipe_page oder dish.`;
    const videoUrl=String(video.url||'').trim();
    const directVideoUrl=mode==='video'&&/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(videoUrl)?videoUrl:'';
    const actualVideoPrompt=`Analysiere das tatsächlich beigefügte öffentliche YouTube-Rezeptvideo für eine deutsche Familien-Rezept-App.
Nutze die gesprochene Anleitung, sichtbare Zutaten, eingeblendete Mengen und die gezeigten Arbeitsschritte. Erstelle daraus ein nachkochbares Rezept für vier Portionen.

Katalogangaben zur Einordnung:
Titel: ${String(video.title).slice(0,300)}
Kanal: ${String(video.channel||'').slice(0,120)}
Kategorie: ${String(video.meal||'').slice(0,80)}
Küche: ${String(video.cuisine||'').slice(0,80)}

Wichtig:
- Behaupte nicht, Kommentare gelesen zu haben. YouTube-Kommentare sind nicht Teil dieser Analyse.
- Bevorzuge Angaben, die im Ton, Bild oder eingeblendeten Text tatsächlich vorkommen.
- Fehlt eine genaue Menge, ergänze nur eine plausible Menge und senke confidence entsprechend.
- Gib mindestens 5 konkrete Zutaten und 4 klare Arbeitsschritte aus.
- Nutze deutsche Bezeichnungen und metrische Mengen.
- Nährwerte pro Portion sind eine gekennzeichnete Schätzung.
- imageType ist video.`;
    const catalogVideoPrompt=`Erstelle für eine deutsche Familien-Rezept-App einen brauchbaren Rezeptentwurf aus den folgenden Katalogdaten eines Rezeptvideos:
Titel: ${String(video.title).slice(0,300)}
Kanal: ${String(video.channel||'').slice(0,120)}
Kategorie: ${String(video.meal||'').slice(0,80)}
Küche: ${String(video.cuisine||'').slice(0,80)}
Weitere Katalogangaben: ${String(video.meta||'').slice(0,300)}

Wichtig:
- Behaupte nicht, das Video, ein Transkript oder Kommentare gesehen zu haben. Es liegen nur diese Katalogdaten vor.
- Erstelle ein alltagstaugliches, plausibles Rezept für vier Portionen mit deutschen, metrischen Mengen.
- Wenn der Titel mehrere Gerichte oder einen Tagesplan nennt, fasse ihn zu einem sinnvoll nachkochbaren Hauptrezept zusammen.
- Nutze keine ungewöhnlichen Zutaten, die sich nicht aus Titel, Küche oder Kategorie ergeben.
- Gib mindestens 5 konkrete Zutaten und 4 klare Arbeitsschritte aus.
- Nährwerte pro Portion sind eine gekennzeichnete Schätzung.
- confidence liegt zwischen 0 und 1 und muss bei einem unklaren Titel niedriger sein.
- imageType ist video.`;
    const urlPrompt=`Lies ausschließlich die öffentlich erreichbare Rezeptseite ${pageUrl} und übertrage das dort beschriebene Rezept in strukturiertes Deutsch.
Nutze bevorzugt die auf der Seite vorhandenen Recipe-/JSON-LD-Daten. Übernimm Titel, Portionen, Zeit, Zutaten mit metrischen Mengen, Kochschritte und vorhandene Nährwerte. Übersetze fremdsprachige Angaben ins Deutsche.
Wichtig:
- Erfinde kein anderes Gericht und keine ungewöhnlichen Zutaten.
- Wenn Mengen oder Nährwerte fehlen, ergänze nur eine plausible Schätzung und senke confidence.
- Gib mindestens 3 Zutaten und 3 klare Arbeitsschritte aus.
- Nährwerte gelten pro Portion und bleiben eine Schätzung, wenn die Seite keine vollständigen Werte nennt.
- imageType ist recipe_page.
- Antworte ausschließlich als JSON passend zum verlangten Schema, ohne Markdown oder Erläuterung.`;
    const recipeSchema={type:'object',additionalProperties:false,properties:{title:{type:'string'},imageType:{type:'string',enum:['recipe_page','dish','video']},confidence:{type:'number'},portions:{type:'integer'},time:{type:'string'},tags:{type:'array',items:{type:'string'}},ingredients:{type:'array',minItems:mode==='video'?5:3,items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},quantity:{type:'string'}},required:['name','quantity']}},steps:{type:'array',minItems:mode==='video'?4:3,items:{type:'string'}},nutrition:{type:'object',additionalProperties:false,properties:{kcal:{type:'number'},protein:{type:'number'},carbs:{type:'number'},fat:{type:'number'}},required:['kcal','protein','carbs','fat']}},required:['title','imageType','confidence','portions','time','tags','ingredients','steps','nutrition']};
    const models=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.5-flash-lite'];
    const variants:any[]=mode==='image'
      ?[{source:'image',parts:[{text:imagePrompt},{inlineData:{mimeType,data:imageData}}]}]
      :mode==='url'
        ?[{source:'url',parts:[{text:urlPrompt}],tools:[{urlContext:{}}]}]
      :directVideoUrl
        ?[{source:'video',parts:[{fileData:{fileUri:directVideoUrl}},{text:actualVideoPrompt}]},{source:'catalog',parts:[{text:catalogVideoPrompt}]}]
        :[{source:'catalog',parts:[{text:catalogVideoPrompt}]}];
    let response:Response|undefined;
    let data:any;
    let lastDetail='';
    let usedSource='';
    requestLoop:for(const variant of variants){
      const requestBody=JSON.stringify({contents:[{role:'user',parts:variant.parts}],...(variant.tools?{tools:variant.tools}:{}),generationConfig:{responseMimeType:'application/json',responseJsonSchema:recipeSchema,temperature:mode==='video'?.25:.2}});
      for(const model of models){
        response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
          method:'POST',headers:{'x-goog-api-key':key,'content-type':'application/json'},body:requestBody
        });
        data=await response.json();
        if(response.ok){usedSource=variant.source;break requestLoop}
        lastDetail=data?.error?.message||`Gemini antwortet mit ${response.status}`;
        if(response.status===401||response.status===403)throw new Error('Der Gemini-API-Schlüssel ist ungültig oder für dieses Projekt nicht freigegeben.');
      }
    }
    if(!response?.ok){
      if(/quota|resource.*exhausted/i.test(lastDetail))throw new Error('Das kostenlose Gemini-Kontingent ist momentan ausgeschöpft. Bitte später erneut versuchen oder die Limits in Google AI Studio prüfen.');
      throw new Error('Die kostenlose KI ist momentan stark ausgelastet. Fami hat mehrere Modelle ausprobiert. Bitte versuche es in einigen Minuten erneut.');
    }
    const text=data?.candidates?.[0]?.content?.parts?.map((part:{text?:string})=>part.text||'').join('').trim();
    if(!text)throw new Error('Die KI hat kein auswertbares Ergebnis geliefert.');
    const parsed=JSON.parse(text),minimumIngredients=mode==='video'?5:3,minimumSteps=mode==='video'?4:3;
    if(!Array.isArray(parsed.ingredients)||parsed.ingredients.length<minimumIngredients||!Array.isArray(parsed.steps)||parsed.steps.length<minimumSteps)throw new Error('Die KI konnte noch kein vollständiges Rezept erstellen. Bitte erneut versuchen.');
    return reply({recipe:{...parsed,analysisSource:usedSource}});
  }catch(error){console.error(error);return reply({error:error instanceof Error?error.message:String(error)},500)}
});
