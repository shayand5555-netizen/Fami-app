(() => {
  const clean = value => String(value || '')
    .replace(/\r/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`_]/g, '')
    .replace(/[•●▪◦]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const numberValue = value => {
    const normalized = String(value || '').trim().replace(',', '.');
    const fractions = {'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125};
    if (fractions[normalized] !== undefined) return fractions[normalized];
    if (/^\d+\s+\d+\/\d+$/.test(normalized)) {
      const [whole, fraction] = normalized.split(/\s+/); const [a,b] = fraction.split('/').map(Number);
      return Number(whole) + a / b;
    }
    if (/^\d+\/\d+$/.test(normalized)) { const [a,b] = normalized.split('/').map(Number); return a / b; }
    return Number.parseFloat(normalized) || 0;
  };

  const nutritionDb = [
    ['olivenöl',884,0,0,100],['öl',884,0,0,100],['butter',717,.9,.1,81],['margarine',720,.2,.5,80],
    ['reis',360,7,79,.7],['nudeln',350,12,70,2],['spaghetti',350,12,70,2],['kartoffel',77,2,17,.1],['mehl',350,10,73,1],['haferflocken',370,13,59,7],
    ['zucker',400,0,100,0],['honig',304,.3,82,0],['schokolade',535,7,59,30],['mandel',579,21,22,50],['walnuss',654,15,14,65],
    ['hähnchen',165,31,0,3.6],['pute',135,29,0,1.5],['rinderhack',250,26,0,17],['hackfleisch',250,26,0,17],['rind',250,26,0,17],['schwein',242,27,0,14],['lachs',208,20,0,13],['thunfisch',132,29,0,1],
    ['ei',143,13,.7,10],['milch',64,3.4,4.8,3.6],['joghurt',63,5,7,1.6],['quark',67,12,4,.2],['skyr',63,11,4,.2],['sahne',292,2.5,3,30],['käse',356,25,2,27],['feta',265,14,4,21],
    ['tomate',18,.9,3.9,.2],['zwiebel',40,1.1,9.3,.1],['knoblauch',149,6.4,33,.5],['paprika',31,1,6,.3],['möhre',41,.9,10,.2],['karotte',41,.9,10,.2],['gurke',15,.7,3.6,.1],['zucchini',17,1.2,3.1,.3],['brokkoli',34,2.8,7,.4],['spinat',23,2.9,3.6,.4],['salat',15,1.4,2.9,.2],
    ['apfel',52,.3,14,.2],['banane',89,1.1,23,.3],['orange',47,.9,12,.1],['zitrone',29,1.1,9.3,.3],
    ['linse',352,25,60,1.1],['kichererbse',364,19,61,6],['bohne',333,21,60,1.2],['tofu',144,17,3,9],['brot',250,9,49,3.2]
  ];

  const unitWeight = (quantity, name) => {
    const match = String(quantity || '').toLowerCase().match(/(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛])\s*(kg|g|mg|ml|cl|dl|l|el|tl|esslöffel|teelöffel|stück|stk|dose|packung|bund|zehe|zehen)?/i);
    if (!match) return 0;
    const amount = numberValue(match[1]); const unit = (match[2] || 'stück').toLowerCase();
    if (unit === 'kg') return amount * 1000;
    if (unit === 'g') return amount;
    if (unit === 'mg') return amount / 1000;
    if (unit === 'l') return amount * 1000;
    if (unit === 'dl') return amount * 100;
    if (unit === 'cl') return amount * 10;
    if (unit === 'ml') return amount;
    if (unit === 'el' || unit === 'esslöffel') return amount * 15;
    if (unit === 'tl' || unit === 'teelöffel') return amount * 5;
    if (unit === 'zehe' || unit === 'zehen') return amount * 4;
    if (unit === 'bund') return amount * 80;
    if (unit === 'dose') return amount * 400;
    if (unit === 'packung') return amount * 200;
    const lower = String(name || '').toLowerCase();
    if (/ei(?:er)?\b/.test(lower)) return amount * 60;
    if (/zwiebel|apfel|orange|tomate/.test(lower)) return amount * 120;
    if (/banane|paprika|zucchini|gurke/.test(lower)) return amount * 180;
    if (/kartoffel|möhre|karotte/.test(lower)) return amount * 100;
    if (/zitrone|limette/.test(lower)) return amount * 80;
    if (/brot|brötchen/.test(lower)) return amount * 60;
    return amount * 100;
  };

  function estimateNutrition(ingredients, portions = 4, title = '') {
    const total = {kcal:0,protein:0,carbs:0,fat:0}; let recognized = 0;
    ingredients.forEach(([name, quantity]) => {
      const lower = name.toLowerCase(); const item = nutritionDb.find(([key]) => lower.includes(key));
      if (!item) return; const grams = unitWeight(quantity, name); if (!grams) return;
      recognized += 1; total.kcal += item[1] * grams / 100; total.protein += item[2] * grams / 100; total.carbs += item[3] * grams / 100; total.fat += item[4] * grams / 100;
    });
    const count = Math.max(1, Number(portions) || 4);
    if (recognized < Math.max(1, Math.ceil(ingredients.length * .3))) {
      const text = `${title} ${ingredients.map(item => item[0]).join(' ')}`.toLowerCase();
      let values = /kuchen|dessert|cookie|torte|brownie|süß/.test(text) ? [410,8,52,19] : /salat|suppe/.test(text) ? [330,15,38,13] : /frühstück|müsli|pancake/.test(text) ? [460,20,58,16] : [610,32,68,22];
      return {kcal:values[0],protein:values[1],carbs:values[2],fat:values[3],label:'pro Portion',estimated:true,note:'KI-Schätzung nach Rezeptart; bitte bei besonderen Produkten prüfen.'};
    }
    return {kcal:Math.round(total.kcal/count),protein:Math.round(total.protein/count),carbs:Math.round(total.carbs/count),fat:Math.round(total.fat/count),label:'pro Portion',estimated:true,note:`KI-Schätzung aus ${recognized} erkannten Zutaten für ${count} Portionen.`};
  }

  const ingredientLine = line => {
    const value = line.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^(?:[-–—*]\s*|\d+[.)]\s+)/, '').trim();
    if (!value || value.length > 140) return null;
    if (value.includes('|')) { const [name, ...rest] = value.split('|'); return [name.trim(), rest.join('|').trim() || 'nach Bedarf']; }
    const units = '(?:kg|g|mg|ml|cl|dl|l|EL|TL|Esslöffel|Teelöffel|Stück|Stk\.?|Dose|Packung|Bund|Zehe(?:n)?|tbsp|tsp|cups?|pcs?|cloves?)';
    let match = value.match(new RegExp(`^((?:\\d+(?:[.,]\\d+)?(?:\\s+\\d+\\/\\d+)?|\\d+\\/\\d+|[¼½¾⅓⅔⅛])\\s*${units}?)\\s+(.+)$`, 'i'));
    if (match) return [match[2].trim(), match[1].trim()];
    match = value.match(new RegExp(`^(.+?)\\s+((?:\\d+(?:[.,]\\d+)?|\\d+\\/\\d+|[¼½¾⅓⅔⅛])\\s*${units})$`, 'i'));
    if (match) return [match[1].trim(), match[2].trim()];
    return null;
  };

  function parseRecipeText(raw, seed = {}) {
    const markdownMethod=String(raw||'').match(/(?:^|\n)#{1,2}\s*(?:zubereitung|anleitung|instructions?|method|methode)\s*\n([\s\S]*?)(?=\n#{1,2}\s+\S|$)/i)?.[1]||'';
    const text = clean(raw).replace(/^#+\s*/gm, '').replace(/\*\*/g, '');
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const isHeading = (line, pattern) => pattern.test(line.replace(/[:：]$/, '').trim());
    const ingredientAt = lines.findIndex(line => isHeading(line, /^(zutaten|ingredients|du brauchst|einkaufsliste)(\s+für.*)?$/i));
    const stepsAt = lines.findIndex(line => isHeading(line, /^(zubereitung|anleitung|zubereitungsanleitung|instructions?|so geht.?s|methode|methods?)$/i));
    const nutritionAt = lines.findIndex(line => /^(nährwert|nutrition)/i.test(line));
    let ingredientLines = [];
    if (ingredientAt >= 0) {
      const nutritionDetailsAt=lines.findIndex((line,index)=>index>ingredientAt+1&&/^(?:nutrition|nährwerte?)\s*:/i.test(line));
      const end = [stepsAt,nutritionDetailsAt].filter(index => index > ingredientAt).sort((a,b)=>a-b)[0] ?? lines.length;
      ingredientLines = lines.slice(ingredientAt + 1, end);
    } else ingredientLines = lines.filter(line => ingredientLine(line));
    const ingredients = ingredientLines.map(ingredientLine).filter(Boolean);
    let steps = [];
    if (stepsAt >= 0) {
      const end = nutritionAt > stepsAt ? nutritionAt : lines.length;
      steps = lines.slice(stepsAt + 1, end).map(line => line.replace(/^\s*(?:(?:schritt|step)\s*)?\d+[.):\-]?\s*/i, '').replace(/^[-–—*]\s*/, '').trim()).filter(line => line.length > 12 && !ingredientLine(line)).slice(0,12);
    }
    if(markdownMethod)steps=clean(markdownMethod).replace(/^#+\s*/gm,'').split('\n').map(line=>line.replace(/^\s*(?:(?:schritt|step)\s*)?\d+[.):\-]?\s*/i,'').replace(/^[-–—*]\s*/,'').trim()).filter(line=>line.length>12&&!ingredientLine(line)).slice(0,12);
    if (!steps.length) steps = lines.filter(line => /\b(geben|mischen|rühren|schneiden|braten|backen|kochen|erhitzen|würzen|garen|servieren|hinzufügen|unterheben|vermengen)\b/i.test(line) && line.length > 18).slice(0,12);
    const portionsMatch = text.match(/(?:für\s*)?(\d+)\s*(?:portion(?:en)?|personen|servings?)/i);
    const portions = seed.portions || Number(portionsMatch?.[1]) || 4;
    const timeMatch = text.match(/(?:gesamtzeit|zubereitungszeit|kochzeit|zeit)\s*:?[ \t]*(\d+)\s*(?:min(?:uten)?|minutes?)/i);
    const firstCandidate = lines.find(line => line.length >= 4 && line.length <= 90 && !/^(title|url|zutaten|zubereitung|nährwert)/i.test(line) && !ingredientLine(line));
    const title = seed.title || firstCandidate?.replace(/^title:\s*/i, '') || 'Gescanntes Rezept';
    const base = {title,ingredients,steps,portions,time:seed.time || (timeMatch ? `${timeMatch[1]} Min.` : 'Eigene Sammlung'),tags:seed.tags || ['Gescannt','Eigenes Rezept'],image:seed.image || '',url:seed.url || '',source:seed.source || 'Foto-Scan'};
    base.nutrition = seed.nutrition || nutritionFromText(text) || estimateNutrition(ingredients, portions, title);
    return base;
  }

  function findRecipeJson(value) {
    if (!value) return null;
    if (Array.isArray(value)) { for (const item of value) { const found = findRecipeJson(item); if (found) return found; } return null; }
    if (typeof value !== 'object') return null;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some(type => String(type).toLowerCase() === 'recipe')) return value;
    return findRecipeJson(value['@graph']);
  }

  const instructionText = value => {
    if (!value) return [];
    if (typeof value === 'string') return value.split(/\n+/).map(clean).filter(Boolean);
    if (Array.isArray(value)) return value.flatMap(instructionText);
    return instructionText(value.text || value.itemListElement || value.name);
  };

  const parseNutritionNumber = value => Number.parseFloat(String(value || '').replace(',', '.')) || 0;

  function nutritionFromText(text) {
    const exactAt=text.search(/(?:nährwerte?|nutrition)\s*:/i),fallbackAt=text.search(/(?:nährwerte?|nutrition)/i),start=exactAt>=0?exactAt:fallbackAt;
    const section = start>=0?text.slice(start,start+1200):'';
    if (!section) return null;
    const kcal = parseNutritionNumber(section.match(/(?:kcal\s*:?[ \t]*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*kcal)/i)?.slice(1).find(Boolean));
    const protein = parseNutritionNumber(section.match(/(?:protein|eiweiß)\s*:?[ \t]*(\d+(?:[.,]\d+)?)\s*g/i)?.[1]);
    const carbs = parseNutritionNumber(section.match(/(?:kohlenhydrate|carbs?)\s*:?[ \t]*(\d+(?:[.,]\d+)?)\s*g/i)?.[1]);
    const fat = parseNutritionNumber(section.match(/(?:fett|fat)\s*:?[ \t]*(\d+(?:[.,]\d+)?)\s*g/i)?.[1]);
    if (!kcal || !(protein || carbs || fat)) return null;
    return {kcal,protein,carbs,fat,label:/pro\s+portion|je\s+portion/i.test(section)?'pro Portion':'laut Vorlage',estimated:false,note:'Nährwertangaben wurden aus der Vorlage erkannt.'};
  }

  function fromStructuredRecipe(recipe, url) {
    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [];
    const ingredients = rawIngredients.map(line => ingredientLine(String(line)) || [String(line).trim(),'nach Bedarf']).filter(item => item[0]);
    const yieldValue = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield;
    const portions = Number.parseInt(String(yieldValue || '').match(/\d+/)?.[0],10) || 4;
    const n = recipe.nutrition || {}; const hasNutrition = n.calories || n.proteinContent || n.carbohydrateContent || n.fatContent;
    const image = Array.isArray(recipe.image) ? recipe.image[0]?.url || recipe.image[0] : recipe.image?.url || recipe.image || '';
    const result = {title:recipe.name || 'Importiertes Rezept',ingredients,steps:instructionText(recipe.recipeInstructions),portions,time:recipe.totalTime || recipe.prepTime || 'Eigene Sammlung',tags:['Link-Import','Eigenes Rezept'],image,url,source:new URL(url).hostname.replace(/^www\./,''),nutrition:hasNutrition?{kcal:parseNutritionNumber(n.calories),protein:parseNutritionNumber(n.proteinContent),carbs:parseNutritionNumber(n.carbohydrateContent),fat:parseNutritionNumber(n.fatContent),label:'pro Portion',estimated:false,note:'Nährwertangaben der verlinkten Rezeptseite.'}:null};
    if (!result.nutrition) result.nutrition = estimateNutrition(ingredients, portions, result.title);
    return result;
  }

  async function fetchDirectRecipe(url) {
    const response = await fetch(url, {headers:{Accept:'text/html'}}); if (!response.ok) throw new Error(`Seite antwortet mit ${response.status}`);
    const html = await response.text(); const document = new DOMParser().parseFromString(html, 'text/html');
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { const found = findRecipeJson(JSON.parse(script.textContent)); if (found) return fromStructuredRecipe(found, url); } catch {}
    }
    return parseRecipeText(document.body?.innerText || '', {title:document.querySelector('h1')?.textContent?.trim() || document.title,url,source:new URL(url).hostname.replace(/^www\./,''),image:document.querySelector('meta[property="og:image"]')?.content || ''});
  }

  async function analyzeLink(url, progress = () => {}) {
    const normalized = new URL(url).href; progress('Rezeptseite wird gelesen …',20);
    if (window.FamiCloud?.isConnected?.() && window.FamiCloud?.analyzeRecipeUrl) {
      progress('KI liest Zutaten und Kochanleitung …',35);
      const aiResult = await window.FamiCloud.analyzeRecipeUrl(normalized);
      const recipe = normalizeAiRecipe(aiResult);
      recipe.url = normalized;
      recipe.source = new URL(normalized).hostname.replace(/^www\./,'');
      recipe.image = aiResult.image || '';
      recipe.imageType = 'recipe_page';
      recipe.tags = [...(aiResult.tags || []),'Link-Import','Eigenes Rezept'].filter((item,index,list)=>item&&list.indexOf(item)===index);
      progress('Rezeptdaten erkannt',100);
      return recipe;
    }
    try { const result = await fetchDirectRecipe(normalized); if (result.ingredients.length) { progress('Rezeptdaten gefunden',100); return result; } } catch {}
    progress('Öffentlichen Lesetext auswerten …',45);
    const response = await fetch(`https://r.jina.ai/${normalized}`, {headers:{Accept:'text/plain'}});
    if (!response.ok) throw new Error('Der Link konnte nicht gelesen werden. Bitte prüfe, ob die Seite öffentlich erreichbar ist.');
    const text = await response.text(); const title = text.match(/^Title:\s*(.+)$/mi)?.[1]?.trim();
    const result = parseRecipeText(text, {title,url:normalized,source:new URL(normalized).hostname.replace(/^www\./,'')});
    const imageMatch = [...text.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)[^)]*\)/gi)].map(match=>match[1]).find(value=>!/(logo|icon|avatar|sprite)/i.test(value));
    if(imageMatch)result.image=imageMatch;
    if (!result.ingredients.length) throw new Error('Auf dieser Seite wurden keine eindeutigen Zutaten gefunden. Probiere ein Foto des Rezepts.');
    progress('Rezeptdaten erkannt',100); return result;
  }

  function imageDataUrl(file, maxSize = 1600) {
    return new Promise((resolve,reject) => {
      const image = new Image(); const url = URL.createObjectURL(file);
      image.onload = () => {
        const scale=Math.min(1,maxSize/Math.max(image.naturalWidth,image.naturalHeight));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg',.82));
      };
      image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Das Foto konnte nicht geöffnet werden.'))};image.src=url;
    });
  }

  function normalizeAiRecipe(value) {
    const ingredients=(value.ingredients||[]).map(item=>Array.isArray(item)?item:[item.name,item.quantity||'nach Bedarf']).filter(item=>item[0]);
    const portions=Math.max(1,Number(value.portions)||4),title=clean(value.title)||'KI-Rezeptvorschlag';
    return {title,ingredients,steps:(value.steps||[]).map(clean).filter(Boolean),portions,time:clean(value.time)||'ca. 45 Min.',tags:[...(value.tags||[]),'KI-Fotoanalyse','Eigenes Rezept'].filter((item,index,list)=>item&&list.indexOf(item)===index),image:'',url:'',source:'KI-Fotoanalyse',imageType:value.imageType||'dish',confidence:Number(value.confidence)||0,nutrition:{kcal:Number(value.nutrition?.kcal)||0,protein:Number(value.nutrition?.protein)||0,carbs:Number(value.nutrition?.carbs)||0,fat:Number(value.nutrition?.fat)||0,label:'pro Portion',estimated:true,note:'KI-Schätzung aus dem Foto und den erkannten beziehungsweise vorgeschlagenen Zutaten. Bitte Mengen und Allergene prüfen.'}};
  }

  async function analyzePhoto(file, progress = () => {}) {
    if (!file?.type?.startsWith('image/')) throw new Error('Bitte wähle ein Foto des Rezepts aus.');
    if(!window.FamiCloud?.isConnected?.()) throw new Error('Bitte melde dich zuerst bei Fami Online an. Die Fotoanalyse läuft ausschließlich über die KI.');
    if(!window.FamiCloud?.analyzeRecipePhoto) throw new Error('Die KI-Fotoanalyse konnte nicht geladen werden. Bitte aktualisiere die App und versuche es erneut.');
    progress('Foto wird für die KI vorbereitet …',8);
    const image=await imageDataUrl(file);
    progress('KI erkennt Gericht, Zutaten und Zubereitung …',30);
    const aiResult=await window.FamiCloud.analyzeRecipePhoto(image);
    const recipe=normalizeAiRecipe(aiResult);
    if(!recipe.ingredients.length||!recipe.steps.length)throw new Error('Die KI konnte aus diesem Foto noch kein vollständiges Rezept erstellen. Bitte verwende ein helles, scharfes Foto und versuche es erneut.');
    progress('KI-Rezeptvorschlag ist bereit',100);
    return recipe;
  }

  window.FamiRecipeScanner = {analyzePhoto, analyzeLink, estimateNutrition, parseText:parseRecipeText};
})();
