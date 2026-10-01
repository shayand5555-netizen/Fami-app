$ErrorActionPreference = 'Stop'
$catalogPath = Join-Path $PSScriptRoot '..\recipe-videos.json'
$catalog = Get-Content -LiteralPath $catalogPath -Raw -Encoding UTF8 | ConvertFrom-Json
$videos = @($catalog.videos | Where-Object featured)
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.DefaultRequestHeaders.UserAgent.ParseAdd('Mozilla/5.0 Fami-Rezeptkatalog/2.0')

for ($offset = 0; $offset -lt $videos.Count; $offset += 8) {
  $batch = @($videos | Select-Object -Skip $offset -First 8)
  $tasks = @($batch | ForEach-Object { $client.GetStringAsync("https://www.youtube.com/watch?v=$($_.id)&hl=de") })
  [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks)
  for ($index = 0; $index -lt $batch.Count; $index++) {
    $match = [regex]::Match($tasks[$index].Result, '"shortDescription":"((?:\\.|[^"\\])*)"')
    if (-not $match.Success) { continue }
    $description = ('"' + $match.Groups[1].Value + '"') | ConvertFrom-Json
    $ingredients = @($description -split "`r?`n" | ForEach-Object {
      ($_ -replace '^[\s*#-]+','' -replace '\s+',' ').Trim()
    } | Where-Object {
      $_.Length -gt 0 -and $_.Length -lt 120 -and
      $_ -match '(?:\p{Nd}+[\p{Nd}.,/]*\s*\p{L}{1,12})' -and
      $_ -notmatch '(?:https?:|www\.|@|#|\d+:\d+)'
    } | Select-Object -Unique -First 18)
    if ($ingredients.Count) {
      $batch[$index].recipe.ingredients = $ingredients
      $batch[$index].recipe.sourceType = 'Zutaten aus Videobeschreibung - Ablauf als KI-Entwurf'
    }
  }
  Write-Host "Geprueft: $([Math]::Min($offset + $batch.Count, $videos.Count))/$($videos.Count)"
}
$client.Dispose()
$json = $catalog | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($catalogPath, $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
