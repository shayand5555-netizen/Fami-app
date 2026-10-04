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
    const key=Deno.env.get('OPENAI_API_KEY');
    if(!key)throw new Error('OPENAI_API_KEY ist in Supabase noch nicht eingerichtet.');
    const {image}=await request.json();
    if(typeof image!=='string'||!image.startsWith('data:image/'))return reply({error:'Ungültiges Bild.'},400);
    if(image.length>8_000_000)return reply({error:'Das Foto ist zu groß.'},413);
    const prompt=`Analysiere das Foto für eine deutsche Familien-Rezept-App. Es kann entweder eine fotografierte Rezeptseite oder ein fertiges Gericht zeigen.
- Bei einer Rezeptseite: lies Titel, Zutaten, Mengen und Schritte möglichst genau ab.
- Bei einem fertigen Gericht: erkenne das wahrscheinlichste Gericht und erstelle einen plausiblen, klar als Schätzung behandelbaren Rezeptvorschlag für vier Portionen.
- Erfinde keine ungewöhnlichen Zutaten. Nutze deutsche Bezeichnungen und metrische Mengen.
- Schätze Nährwerte pro Portion realistisch. Sie sind nur Orientierungswerte.
- confidence liegt zwischen 0 und 1. Bei unklarem Foto niedrig ansetzen.
- imageType ist recipe_page oder dish.`;
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},
      body:JSON.stringify({model:'gpt-4.1-mini',store:false,input:[{role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:image,detail:'high'}]}],text:{format:{type:'json_schema',name:'recipe_analysis',strict:true,schema:{type:'object',additionalProperties:false,properties:{title:{type:'string'},imageType:{type:'string',enum:['recipe_page','dish']},confidence:{type:'number'},portions:{type:'integer'},time:{type:'string'},tags:{type:'array',items:{type:'string'}},ingredients:{type:'array',items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},quantity:{type:'string'}},required:['name','quantity']}},steps:{type:'array',items:{type:'string'}},nutrition:{type:'object',additionalProperties:false,properties:{kcal:{type:'number'},protein:{type:'number'},carbs:{type:'number'},fat:{type:'number'}},required:['kcal','protein','carbs','fat']}},required:['title','imageType','confidence','portions','time','tags','ingredients','steps','nutrition']}}}})
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data?.error?.message||`OpenAI antwortet mit ${response.status}`);
    const text=data.output?.flatMap((item:{content?:Array<{type?:string;text?:string}>})=>item.content||[]).find((item:{type?:string})=>item.type==='output_text')?.text;
    if(!text)throw new Error('Die KI hat kein auswertbares Ergebnis geliefert.');
    return reply({recipe:JSON.parse(text)});
  }catch(error){console.error(error);return reply({error:error instanceof Error?error.message:String(error)},500)}
});
