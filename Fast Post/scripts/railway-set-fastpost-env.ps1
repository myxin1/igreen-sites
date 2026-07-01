param(
  [string]$Service = "web",
  [string]$Environment = "production",
  [switch]$DeployAfter
)

$required = @(
  "FASTPOST_SESSION_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "FASTPOST_PUBLIC_BASE_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "ZERNIO_API_KEY",
  "ZERNIO_WEBHOOK_SECRET"
)

$optional = @(
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE"
)

$missing = @()
foreach ($name in $required) {
  if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
    $missing += $name
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing required environment variables: " + ($missing -join ", "))
  exit 1
}

$names = $required + ($optional | Where-Object { [Environment]::GetEnvironmentVariable($_, "Process") })
$skipDeployArgs = @()
if (-not $DeployAfter) {
  $skipDeployArgs = @("--skip-deploys")
}

foreach ($name in $names) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if ($null -ne $value -and $value.Trim().Length -gt 0) {
    railway.cmd variable set "$name=$value" --service $Service --environment $Environment @skipDeployArgs
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }
}

Write-Host "FastPost Railway variables synced for service '$Service' in '$Environment'."
if (-not $DeployAfter) {
  Write-Host "Deploy was skipped. Run 'railway.cmd up -d --service $Service' after verifying the variables."
}
