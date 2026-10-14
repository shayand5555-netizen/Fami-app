param(
  [string]$Url = 'https://shayand5555-netizen.github.io/Fami-app/',
  [string]$ExpectedVersion = '0.49.4'
)

$ErrorActionPreference = 'Stop'
$script:nextId = 0
$script:events = @()
$script:results = @()

function Add-Result([string]$Area,[string]$Name,[bool]$Passed,[string]$Detail='') {
  $script:results += [pscustomobject]@{Area=$Area;Name=$Name;Passed=$Passed;Detail=$Detail}
}

function Send-Cdp([System.Net.WebSockets.ClientWebSocket]$Socket,[string]$Method,[hashtable]$Params=@{}) {
  $script:nextId++
  $id=$script:nextId
  $json=@{id=$id;method=$Method;params=$Params} | ConvertTo-Json -Compress -Depth 30
  $bytes=[Text.Encoding]::UTF8.GetBytes($json)
  $Socket.SendAsync([ArraySegment[byte]]::new($bytes),[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  while($true){
    $stream=[IO.MemoryStream]::new()
    do{
      $buffer=New-Object byte[] 65536
      $received=$Socket.ReceiveAsync([ArraySegment[byte]]::new($buffer),[Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if($received.MessageType -eq [Net.WebSockets.WebSocketMessageType]::Close){throw 'Browser-Verbindung wurde geschlossen'}
      $stream.Write($buffer,0,$received.Count)
    }while(-not $received.EndOfMessage)
    $message=[Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
    if($message.id -eq $id){return $message.result}
    $script:events += $message
  }
}

function Invoke-Js([System.Net.WebSockets.ClientWebSocket]$Socket,[string]$Expression) {
  $response=Send-Cdp $Socket 'Runtime.evaluate' @{expression=$Expression;returnByValue=$true;awaitPromise=$true;userGesture=$true}
  if($response.exceptionDetails){
    $description=$response.exceptionDetails.exception.description
    if([string]::IsNullOrWhiteSpace($description)){$description=$response.exceptionDetails.text}
    $preview=if($Expression.Length -gt 180){$Expression.Substring(0,180)+'...'}else{$Expression}
    throw "JavaScript-Fehler: $description`nAusdruck: $preview"
  }
  return $response.result.value
}

$chromeCandidates=@(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$chrome=$chromeCandidates | Where-Object {Test-Path $_} | Select-Object -First 1
if(-not $chrome){throw 'Kein Chromium-Browser gefunden'}

$port=9400+(Get-Random -Minimum 0 -Maximum 300)
$profile=Join-Path $env:TEMP "fami-release-qa-$port"
$browser=$null
$socket=$null
try{
  New-Item -ItemType Directory -Force -Path $profile | Out-Null
  $arguments=@('--headless=new',"--remote-debugging-port=$port","--user-data-dir=$profile",'--window-size=390,844','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions','about:blank')
  $browser=Start-Process -FilePath $chrome -ArgumentList $arguments -WindowStyle Hidden -PassThru
  $target=$null
  for($attempt=0;$attempt -lt 80 -and -not $target;$attempt++){
    Start-Sleep -Milliseconds 250
    try{
      $targets=Invoke-RestMethod "http://127.0.0.1:$port/json/list"
      for($targetIndex=0;$targetIndex -lt $targets.Count;$targetIndex++){
        $candidate=$targets[$targetIndex]
        if($candidate.type -eq 'page' -and $candidate.url -eq 'about:blank'){$target=$candidate;break}
      }
      if(-not $target){
        for($targetIndex=0;$targetIndex -lt $targets.Count;$targetIndex++){
          $candidate=$targets[$targetIndex]
          if($candidate.type -eq 'page' -and $candidate.url -notlike 'chrome-extension://*'){$target=$candidate;break}
        }
      }
    }catch{}
  }
  if(-not $target){throw 'Testbrowser konnte nicht verbunden werden'}
  $debuggerUrl=[string](@($target)[0].webSocketDebuggerUrl | Select-Object -First 1)
  if([string]::IsNullOrWhiteSpace($debuggerUrl)){throw 'Testbrowser hat keine Debug-Verbindung geliefert'}
  $socket=[Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync([Uri]$debuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
  Send-Cdp $socket 'Runtime.enable' | Out-Null
  Send-Cdp $socket 'Page.enable' | Out-Null
  Send-Cdp $socket 'Log.enable' | Out-Null
  Send-Cdp $socket 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=3;mobile=$true} | Out-Null
  Send-Cdp $socket 'Page.navigate' @{url=($Url+'?release-qa='+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())} | Out-Null
  for($attempt=0;$attempt -lt 80;$attempt++){
    Start-Sleep -Milliseconds 250
    if((Invoke-Js $socket "document.readyState==='complete'&&location.href.startsWith('$Url')&&!!document.querySelector('#cloudStatus')")){break}
  }
  Start-Sleep -Seconds 3
  if(-not (Invoke-Js $socket "location.href.startsWith('$Url')&&!!document.querySelector('#cloudStatus')")){throw "App-Seite wurde nicht vollständig geladen: $(Invoke-Js $socket 'location.href')"}

  $boot=Invoke-Js $socket "(()=>({version:document.querySelector('#appVersion span')?.textContent||'',state:typeof state==='object',cloud:typeof window.FamiCloud==='object',nav:!!document.querySelector('.mobile-nav'),overflow:document.documentElement.scrollWidth-window.innerWidth,errors:JSON.parse(localStorage.getItem('fami-runtime-issues')||'[]').length}))()"
  Add-Result 'Start' 'App lädt vollständig' ($boot.state -and $boot.cloud -and $boot.nav) "Version $($boot.version)"
  Add-Result 'Start' 'Richtige Version' ($boot.version -eq "v$ExpectedVersion") $boot.version
  Add-Result 'iPhone' 'Keine horizontale Überbreite' ([double]$boot.overflow -le 1) "Differenz $($boot.overflow) px"
  Add-Result 'Start' 'Keine gespeicherten Laufzeitfehler' ([int]$boot.errors -eq 0) "$($boot.errors) Fehler"

  foreach($viewportWidth in @(320,390,430)){
    Send-Cdp $socket 'Emulation.setDeviceMetricsOverride' @{width=$viewportWidth;height=844;deviceScaleFactor=3;mobile=$true} | Out-Null
    $viewport=Invoke-Js $socket "(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,viewport:document.querySelector('meta[name=viewport]')?.content||''}))()"
    Add-Result 'iPhone' "Layout bei $viewportWidth px Breite" ([double]$viewport.overflow -le 1 -and $viewport.viewport -match 'width=device-width') "Differenz $($viewport.overflow) px"
  }
  Send-Cdp $socket 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=3;mobile=$true} | Out-Null

  $cloudOpen=Invoke-Js $socket "(()=>{document.querySelector('#cloudStatus').click();return document.querySelector('#cloudModal').classList.contains('open')})()"
  Add-Result 'Cloud' '„Lokal gespeichert“ öffnet Anmeldung' ([bool]$cloudOpen)
  Invoke-Js $socket "document.querySelector('[data-cloud-close]').click();true" | Out-Null

  $eventResult=Invoke-Js $socket "(()=>{openModal('event');document.querySelector('#itemTitle').value='QA Weihnachtsfeier';document.querySelector('#itemDate').value='2026-12-11';document.querySelector('#itemEndDate').value='2026-12-11';document.querySelector('#itemTime').value='12:00';document.querySelector('#itemEndTime').value='13:00';const people=[...document.querySelectorAll('#itemEventPeople input')];people.slice(0,2).forEach(input=>input.checked=true);document.querySelector('#createForm').requestSubmit();const found=state.events.find(item=>item.title==='QA Weihnachtsfeier');return{saved:!!found,people:found?.people?.length||0,closed:!document.querySelector('#modal').classList.contains('open'),persisted:JSON.parse(localStorage.getItem('fami-state')||'{}').events?.some(item=>item.title==='QA Weihnachtsfeier')||false}})()"
  Add-Result 'Kalender' 'Termin anlegen und lokal speichern' ($eventResult.saved -and $eventResult.persisted -and $eventResult.closed)
  Add-Result 'Kalender' 'Mehrere Zuständige speichern' ([int]$eventResult.people -ge 2) "$($eventResult.people) Personen"

  $taskResult=Invoke-Js $socket "(()=>{openModal('task');document.querySelector('#itemTitle').value='QA Aufgabe';document.querySelector('#itemDate').value='2026-12-12';document.querySelector('#createForm').requestSubmit();return state.tasks.some(item=>item.title==='QA Aufgabe')})()"
  Add-Result 'Aufgaben' 'Aufgabe anlegen' ([bool]$taskResult)
  $taskSyncResult=Invoke-Js $socket "(()=>{const tasks=JSON.parse(JSON.stringify(state.tasks)),activity=JSON.parse(JSON.stringify(state.activityLog)),id='qa-task-sync',old='2026-01-01T08:00:00.000Z';state.tasks.push({id,title:'QA dauerhaft erledigt',person:family[0],date:'2026-12-12',dateLabel:'12. Dez.',note:'',done:false,updatedAt:old});setDone(id,true);const completed=state.tasks.find(item=>item.id===id),stale={...completed,done:false,updatedAt:old},merged=mergeSharedCollection([completed],[stale]).find(item=>item.id===id),result={done:completed?.done===true,timestamp:Date.parse(completed?.updatedAt||'')>Date.parse(old),survives:merged?.done===true};state.tasks=tasks;state.activityLog=activity;save();return result})()"
  Add-Result 'Aufgaben' 'Abhaken bleibt nach Cloud-Abgleich erhalten' ($taskSyncResult.done -and $taskSyncResult.timestamp -and $taskSyncResult.survives)

  $calendarResult=Invoke-Js $socket "(()=>{switchView('calendar');const aha=state.events.filter(item=>String(item.source||'').startsWith('aha Abfuhrkalender'));return{aha:aha.length,bio:aha.some(item=>item.title==='Bioabfall'),orange:aha.every(item=>item.color==='orange'),visible:aha.every(item=>eventVisible(item)),days:document.querySelectorAll('.month-day').length,weekButton:!!document.querySelector('[data-calendar-view=week]')}})()"
  Add-Result 'Kalender' '25 aha-Abholtermine vollständig' ([int]$calendarResult.aha -eq 25) "$($calendarResult.aha) Termine"
  Add-Result 'Kalender' 'Bioabfall und orange Markierung' ($calendarResult.bio -and $calendarResult.orange)
  Add-Result 'Kalender' 'Systemtermine unabhängig vom Personenfilter sichtbar' ([bool]$calendarResult.visible)
  Add-Result 'Kalender' 'Monats- und Wochenansicht vorhanden' ([int]$calendarResult.days -ge 35 -and $calendarResult.weekButton) "$($calendarResult.days) Tagesfelder"

  $advancedCalendar=Invoke-Js $socket "(()=>{const backup=JSON.parse(JSON.stringify(state.events));const weekly=addEventSeries({id:'qa-series-start',title:'QA Wiederholung',date:'2026-10-13',endDate:'2026-10-15',time:'09:00',endTime:'10:00',people:[family[0]],color:'blue'},'weekly');const series=state.events.filter(item=>item.title==='QA Wiederholung'),multiDay=series.length&&series.every(item=>daysBetween(item.date,item.endDate)===2),unique=new Set(series.map(item=>item.date)).size===series.length;state.events=backup;save();return{weekly,count:series.length,multiDay,unique}})()"
  Add-Result 'Kalender' 'Wiederholung erzeugt eindeutige Termine' ($advancedCalendar.weekly -gt 50 -and $advancedCalendar.unique) "$($advancedCalendar.count) Termine"
  Add-Result 'Kalender' 'Mehrtägige Dauer bleibt in Serie erhalten' ([bool]$advancedCalendar.multiDay) '2 Tage pro Termin'

  $personColors=Invoke-Js $socket "(()=>{const single=document.createElement('button'),multiple=document.createElement('button'),fixed=document.createElement('button');single.className='event-pill blue';multiple.className='event-pill blue';single.setAttribute('aria-label','Einzeltermin');multiple.setAttribute('aria-label','Familientermin');applyEventPersonColors(single,{people:[family[0]]});applyEventPersonColors(multiple,{people:[family[0],family[1]]});applyEventPersonColors(fixed,{people:[family[0]],source:'aha Abfuhrkalender 2026'});document.body.append(single,multiple);const computedSingle=getComputedStyle(single).backgroundColor,computedMultiple=getComputedStyle(multiple).backgroundImage;single.remove();multiple.remove();return{single:single.style.getPropertyValue('--event-person-background'),singleExpected:familyColor(family[0]).background,multiple:multiple.style.getPropertyValue('--event-person-background'),count:multiple.dataset.personCount,label:multiple.getAttribute('aria-label'),fixed:fixed.hasAttribute('data-person-colors'),computedSingle,computedMultiple}})()"
  Add-Result 'Kalenderfarben' 'Einzeltermin nutzt Profilfarbe' ($personColors.single -eq $personColors.singleExpected -and $personColors.computedSingle -match '237') "$($personColors.single) / $($personColors.computedSingle)"
  Add-Result 'Kalenderfarben' 'Mehrere Personen werden mehrfarbig' ($personColors.multiple -match '^linear-gradient' -and $personColors.computedMultiple -match '^linear-gradient' -and $personColors.count -eq '2' -and $personColors.label -match 'Familientermin') $personColors.multiple
  Add-Result 'Kalenderfarben' 'Aha-Termine bleiben fest orange' (-not $personColors.fixed)
  $colorUi=Invoke-Js $socket "(()=>{const select=document.querySelector('#editEventColor'),hint=document.querySelector('.event-color-hint');return{hidden:select?.closest('label')?.classList.contains('hidden')||false,hint:hint?.textContent||''}})()"
  Add-Result 'Kalenderfarben' 'Automatische Farbe wird im Terminfenster erklärt' ($colorUi.hidden -and $colorUi.hint -match 'automatisch') $colorUi.hint

  $trashResult=Invoke-Js $socket "(async()=>{const original={id:'qa-trash-task',title:'QA Papierkorb',person:family[0],date:'2026-12-13',done:false};state.tasks.push(original);moveToTrash('tasks',original,'Aufgabe');state.tasks=state.tasks.filter(item=>item.id!==original.id);const trash=state.trashItems.find(item=>item.item?.id===original.id);const moved=!!trash;if(trash)await restoreTrashItem(trash.id,{save:false,render:false,notify:false});const restored=state.tasks.find(item=>item.restoredFrom===original.id);state.tasks=state.tasks.filter(item=>item.id!==original.id&&item.restoredFrom!==original.id);state.trashItems=state.trashItems.filter(item=>item.item?.id!==original.id);save();return{moved,restored:!!restored,newId:!!restored&&restored.id!==original.id}})()"
  Add-Result 'Papierkorb' 'Gelöschten Eintrag sicher verschieben' ([bool]$trashResult.moved)
  Add-Result 'Papierkorb' 'Eintrag mit neuer ID wiederherstellen' ($trashResult.restored -and $trashResult.newId)

  $versionResult=Invoke-Js $socket "(async()=>{document.querySelector('#appVersion').click();await new Promise(resolve=>setTimeout(resolve,500));const dialog=document.querySelector('#versionHistoryDialog');const result={open:!!dialog?.open,releases:dialog?.querySelectorAll('details').length||0};dialog?.close();return result})()"
  Add-Result 'Bedienung' 'Versionshistorie öffnet per Versionsnummer' ($versionResult.open -and $versionResult.releases -gt 0) "$($versionResult.releases) Versionen"

  $inviteResult=Invoke-Js $socket "(()=>{document.querySelector('#inviteBtn').click();const open=document.querySelector('#cloudModal').classList.contains('open');document.querySelector('[data-cloud-close]').click();return open})()"
  Add-Result 'Einladung' 'Einladen-Knopf öffnet Familienassistent' ([bool]$inviteResult)

  $mediaResult=Invoke-Js $socket "(async()=>{switchView('recipes');await new Promise(resolve=>setTimeout(resolve,800));const read=()=>[...document.querySelectorAll('#genericView img')].map(img=>img.currentSrc||img.src).filter(Boolean);const before=read();switchView('home');switchView('recipes');await new Promise(resolve=>setTimeout(resolve,800));const after=read();return{before:before.length,after:after.length,stable:before.length===after.length&&before.every((src,index)=>src===after[index]),empty:[...document.querySelectorAll('#genericView img')].filter(img=>!img.getAttribute('src')&&!img.getAttribute('data-src')).length}})()"
  Add-Result 'Rezepte' 'Rezeptbilder bleiben beim Ansichtswechsel stabil' ($mediaResult.before -gt 0 -and $mediaResult.stable -and $mediaResult.empty -eq 0) "$($mediaResult.before) Bilder"

  $mealShopping=Invoke-Js $socket "(()=>{const backup={mealPlan:JSON.parse(JSON.stringify(state.mealPlan)),shoppingItems:JSON.parse(JSON.stringify(state.shoppingItems)),pantryItems:JSON.parse(JSON.stringify(state.pantryItems))};const start=mealWeekStart(),week=isoDate(start);state.mealPlan=state.mealPlan.filter(item=>item.date<week||item.date>isoDate(addDays(start,6)));state.shoppingItems=[];state.pantryItems=[];state.mealPlan.push({id:'qa-meal-1',title:'QA Pasta',date:week,meal:'Abendessen',recipeSnapshot:{id:'qa-r1',title:'QA Pasta',ingredients:[['Tomaten','2 Stk'],['Nudeln','400 g']],steps:['Kochen']}});state.mealPlan.push({id:'qa-meal-2',title:'QA Suppe',date:isoDate(addDays(start,1)),meal:'Abendessen',recipeSnapshot:{id:'qa-r2',title:'QA Suppe',ingredients:[['Tomaten','3 Stk'],['Karotten','500 g']],steps:['Kochen']}});addMealWeekToShopping();const tomato=state.shoppingItems.find(item=>normalizeIngredientName(item.name)==='tomaten');const result={count:state.shoppingItems.length,tomato:tomato?.quantity||'',category:tomato?.category||''};state.mealPlan=backup.mealPlan;state.shoppingItems=backup.shoppingItems;state.pantryItems=backup.pantryItems;save();return result})()"
  Add-Result 'Essen & Einkauf' 'Zutaten automatisch zusammenfassen' ($mealShopping.count -eq 3 -and $mealShopping.tomato -match '^5') "Tomaten: $($mealShopping.tomato), Positionen: $($mealShopping.count)"
  Add-Result 'Essen & Einkauf' 'Einkaufskategorie wird gesetzt' ([string]::IsNullOrWhiteSpace($mealShopping.category) -eq $false) $mealShopping.category

  $quotaResult=Invoke-Js $socket "(()=>{const original=Storage.prototype.setItem;let stateFailures=0,pendingFailures=0;Storage.prototype.setItem=function(key,value){if(key==='fami-state'&&stateFailures++===0)throw new DOMException('quota','QuotaExceededError');if(key==='fami-cloud-pending'){pendingFailures++;throw new DOMException('quota','QuotaExceededError')}return original.call(this,key,value)};localStorage.setItem('fami-cloud-family','qa-family');let ok=true;try{save()}catch(error){ok=false}Storage.prototype.setItem=original;localStorage.removeItem('fami-cloud-family');return{ok,stateFailures,pendingFailures,stateStored:!!localStorage.getItem('fami-state')}})()"
  Add-Result 'Stabilität' 'Speichern übersteht vollen iPhone-Speicher' ($quotaResult.ok -and $quotaResult.stateStored -and $quotaResult.stateFailures -ge 1) "Hauptspeicherfehler simuliert: $($quotaResult.stateFailures)"
  Add-Result 'Stabilität' 'Cloud-Warteschlange blockiert Speichern nicht' ($quotaResult.ok -and $quotaResult.pendingFailures -ge 1) "Warteschlangenfehler simuliert: $($quotaResult.pendingFailures)"

  $recipeResponse=Invoke-Js $socket "fetch('./recipe-videos.json',{cache:'no-store'}).then(async response=>{const data=await response.json();const videos=data.videos||[];return{ok:response.ok,count:videos.length,withRecipe:videos.filter(item=>(item.recipe?.ingredients?.length||item.ingredients?.length)&&(item.recipe?.steps?.length||item.steps?.length)).length,withUrl:videos.filter(item=>/^https:\/\//.test(item.url||'')).length}})"
  Add-Result 'Rezepte' 'Rezeptkatalog lädt' ($recipeResponse.ok -and $recipeResponse.count -gt 1000) "$($recipeResponse.count) Videos"
  Add-Result 'Rezepte' 'Alle Videokarten besitzen Rezeptdaten' ($recipeResponse.withRecipe -eq $recipeResponse.count) "$($recipeResponse.withRecipe)/$($recipeResponse.count)"
  Add-Result 'Rezepte' 'Alle Videokarten besitzen einen Link' ($recipeResponse.withUrl -eq $recipeResponse.count) "$($recipeResponse.withUrl)/$($recipeResponse.count)"

  $assets=Invoke-Js $socket "Promise.all(['./styles.css?v=$ExpectedVersion','./cloud.js?v=$ExpectedVersion','./notifications.js?v=$ExpectedVersion','./family-recipes.js?v=$ExpectedVersion','./recipe-scanner.js?v=$ExpectedVersion','./app.js?v=$ExpectedVersion','./service-worker.js','./manifest.webmanifest'].map(async url=>{try{const response=await fetch(url,{cache:'no-store'});return{url,ok:response.ok,status:response.status}}catch(error){return{url,ok:false,status:0}}}))"
  foreach($asset in $assets){Add-Result 'Auslieferung' $asset.url ([bool]$asset.ok) "HTTP $($asset.status)"}

  $offlineReady=Invoke-Js $socket "navigator.serviceWorker.ready.then(()=>({supported:true,controlled:!!navigator.serviceWorker.controller})).catch(()=>({supported:false,controlled:false}))"
  Send-Cdp $socket 'Network.enable' | Out-Null
  Send-Cdp $socket 'Network.emulateNetworkConditions' @{offline=$true;latency=0;downloadThroughput=0;uploadThroughput=0;connectionType='none'} | Out-Null
  try{$offlineResult=Invoke-Js $socket "fetch('./index.html').then(response=>({ok:response.ok,status:response.status})).catch(error=>({ok:false,status:0,message:error.message}))"}
  finally{Send-Cdp $socket 'Network.emulateNetworkConditions' @{offline=$false;latency=0;downloadThroughput=-1;uploadThroughput=-1;connectionType='wifi'} | Out-Null}
  Add-Result 'Offline' 'Service Worker kontrolliert die App' ($offlineReady.supported -and $offlineReady.controlled)
  Add-Result 'Offline' 'Startseite ist ohne Netz verfügbar' ([bool]$offlineResult.ok) "HTTP $($offlineResult.status)"

  $exceptions=@($script:events | Where-Object {$_.method -in @('Runtime.exceptionThrown','Log.entryAdded') -and ($_.method -ne 'Log.entryAdded' -or $_.params.entry.level -eq 'error')})
  Add-Result 'Stabilität' 'Keine unbehandelten Browserfehler' ($exceptions.Count -eq 0) "$($exceptions.Count) Fehler"

  Invoke-Js $socket "(()=>{state.events=state.events.filter(item=>!String(item.title||'').startsWith('QA '));state.tasks=state.tasks.filter(item=>!String(item.title||'').startsWith('QA '));save();return true})()" | Out-Null
}
finally{
  if($socket){try{$socket.CloseAsync([Net.WebSockets.WebSocketCloseStatus]::NormalClosure,'QA fertig',[Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null}catch{};$socket.Dispose()}
  if($browser -and -not $browser.HasExited){Stop-Process -Id $browser.Id -Force -ErrorAction SilentlyContinue}
  Start-Sleep -Milliseconds 400
  if(Test-Path $profile){Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue}
}

$failed=@($script:results | Where-Object {-not $_.Passed})
$script:results | Format-Table -AutoSize
"`nGesamt: $($script:results.Count) | Bestanden: $($script:results.Count-$failed.Count) | Fehlgeschlagen: $($failed.Count)"
if($failed.Count){exit 1}
