param(
  [string]$Scope = "joao-pedros-projects-b785f288"
)

$requiredKeys = @(
  "DATABASE_PROVIDER",
  "DATABASE_URL",
  "DIRECT_URL",
  "APP_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

$targets = @("preview", "production", "development")
$envFile = Join-Path $PSScriptRoot "..\\.env"

if (-not (Test-Path $envFile)) {
  throw "Arquivo .env nao encontrado."
}

$envMap = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_.Trim() -eq "") {
    return
  }

  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*"(.*)"\s*$') {
    $envMap[$matches[1]] = $matches[2]
    return
  }

  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$') {
    $envMap[$matches[1]] = $matches[2].Trim()
  }
}

foreach ($key in $requiredKeys) {
  if (-not $envMap.ContainsKey($key)) {
    throw "Variavel ausente no .env: $key"
  }
}

foreach ($key in $requiredKeys) {
  foreach ($target in $targets) {
    $tmp = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tmp, $envMap[$key])
    & vercel env remove $key $target -y --scope $Scope *> $null
    Get-Content -Raw $tmp | & vercel env add $key $target --scope $Scope *> $null
    Remove-Item $tmp -Force
  }
}

$deployLog = [System.IO.Path]::GetTempFileName()
$inspectLog = [System.IO.Path]::GetTempFileName()

$deployJson = & vercel deploy -y --scope $Scope --target preview --format json 2> $deployLog
$deployment = $deployJson | ConvertFrom-Json
$inspectJson = & vercel inspect $deployment.url --wait --timeout 10m --scope $Scope --format json 2> $inspectLog
$inspect = $inspectJson | ConvertFrom-Json

Remove-Item $deployLog -Force
Remove-Item $inspectLog -Force

[PSCustomObject]@{
  url = $deployment.url
  inspectUrl = $deployment.inspectorUrl
  readyState = $inspect.readyState
} | ConvertTo-Json -Compress
