param(
  [ValidateSet("preview", "production")]
  [string]$Target = "preview",
  [string]$Scope = "joao-pedros-projects-b785f288"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$requiredKeys = @(
  "DATABASE_PROVIDER",
  "DATABASE_URL",
  "DIRECT_URL",
  "APP_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL"
)

$syncTargets = if ($Target -eq "production") {
  @("development", "production")
} else {
  @("development", "preview")
}
$envFile = Join-Path $PSScriptRoot "..\\.env"

if (-not (Test-Path $envFile)) {
  throw "Arquivo .env nao encontrado."
}

function Read-DotEnv {
  param([string]$Path)

  $values = @{}
  foreach ($line in Get-Content $Path) {
    if ($line -match '^\s*#' -or $line.Trim() -eq "") {
      continue
    }

    if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*"(.*)"\s*$') {
      $values[$matches[1]] = $matches[2]
      continue
    }

    if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$') {
      $values[$matches[1]] = $matches[2].Trim()
    }
  }

  return $values
}

function Invoke-Vercel {
  param(
    [string[]]$Arguments
  )

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "vercel.cmd"
  $psi.WorkingDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.Arguments = ($Arguments | ForEach-Object {
    if ($_ -match '[\s"]') {
      '"' + ($_ -replace '"', '\"') + '"'
    } else {
      $_
    }
  }) -join " "

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  [void]$process.Start()

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  $output = (@($stdout, $stderr) | Where-Object { $_ -and $_.Trim() -ne "" }) -join [Environment]::NewLine
  $exitCode = $process.ExitCode

  return [PSCustomObject]@{
    ExitCode = $exitCode
    Output = $output
  }
}

function Set-VercelEnv {
  param(
    [string]$Name,
    [string]$Environment,
    [string]$Value
  )

  $remove = Invoke-Vercel @("env", "remove", $Name, $Environment, "--yes", "--scope", $Scope)
  if ($remove.ExitCode -ne 0 -and $remove.Output -notmatch "Environment Variable was not found|env_not_found") {
    throw "Falha ao remover $Name em $Environment. $($remove.Output)"
  }

  $add = Invoke-Vercel @("env", "add", $Name, $Environment, "--force", "--yes", "--value", $Value, "--scope", $Scope)
  if ($add.ExitCode -ne 0) {
    throw "Falha ao cadastrar $Name em $Environment. $($add.Output)"
  }

  Write-Host "[ok] $Name -> $Environment"
}

$envMap = Read-DotEnv -Path $envFile
foreach ($key in $requiredKeys) {
  if (-not $envMap.ContainsKey($key)) {
    throw "Variavel ausente no .env: $key"
  }
}

foreach ($environment in $syncTargets) {
  foreach ($key in $requiredKeys) {
    Set-VercelEnv -Name $key -Environment $environment -Value $envMap[$key]
  }
}

$pullFile = Join-Path $PSScriptRoot "..\\.vercel\\.env.$Target.local"
if (Test-Path $pullFile) {
  Remove-Item $pullFile -Force
}

$pull = Invoke-Vercel @("pull", "--yes", "--environment", $Target, "--scope", $Scope)
if ($pull.ExitCode -ne 0) {
  throw "Falha ao validar as envs em $Target. $($pull.Output)"
}

if (-not (Test-Path $pullFile)) {
  throw "Validacao de envs em $Target nao gerou $pullFile."
}

$deployArgs = @("deploy", "--yes", "--scope", $Scope, "--format", "json")
if ($Target -eq "production") {
  $deployArgs += "--prod"
} else {
  $deployArgs += @("--target", "preview")
}

$deploy = Invoke-Vercel -Arguments $deployArgs
if ($deploy.ExitCode -ne 0) {
  throw "Falha no deploy $Target. $($deploy.Output)"
}

$deployment = $deploy.Output | ConvertFrom-Json
$inspect = Invoke-Vercel @("inspect", $deployment.url, "--wait", "--timeout", "10m", "--scope", $Scope, "--format", "json")
if ($inspect.ExitCode -ne 0) {
  throw "Falha ao inspecionar o deploy $Target. $($inspect.Output)"
}

$inspection = $inspect.Output | ConvertFrom-Json
[PSCustomObject]@{
  target = $Target
  url = $deployment.url
  inspectUrl = $deployment.inspectorUrl
  readyState = $inspection.readyState
} | ConvertTo-Json -Compress
