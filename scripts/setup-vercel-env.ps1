# Crée / met à jour les variables d'environnement Vercel (placeholders).
# Prérequis : npx vercel login  (une fois)
# Usage     : npm run vercel:env

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

function Upsert-Env([string]$Name, [string]$Value, [string[]]$Targets) {
  foreach ($target in $Targets) {
    Write-Host "→ $Name ($target)"
    # Supprime si déjà présent (ignore l'erreur sinon)
    echo "y" | npx vercel env rm $Name $target --yes 2>$null | Out-Null
    $Value | npx vercel env add $Name $target --yes
  }
}

$targets = @("production", "preview")
$appUrl = "https://gestion-locative-immobiliere.vercel.app"

Write-Host "Ajout des variables (remplace ensuite les placeholders dans le dashboard Vercel)..."
Upsert-Env "NEXT_PUBLIC_APP_URL" $appUrl $targets
Upsert-Env "NEXT_PUBLIC_SUPABASE_URL" "REPLACE_ME_SUPABASE_URL" $targets
Upsert-Env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "REPLACE_ME_SUPABASE_ANON_KEY" $targets
Upsert-Env "SMTP_HOST" "smtp.gmail.com" $targets
Upsert-Env "SMTP_PORT" "465" $targets
Upsert-Env "SMTP_USER" "REPLACE_ME_SMTP_USER" $targets
Upsert-Env "SMTP_PASS" "REPLACE_ME_SMTP_PASS" $targets
Upsert-Env "SMTP_FROM" "Locagest <REPLACE_ME_SMTP_USER>" $targets

Write-Host ""
Write-Host "OK. Édite les valeurs ici :"
Write-Host "https://vercel.com/waloo-debug/gestion-locative-immobiliere/settings/environment-variables"
Write-Host "Puis Redeploy le projet."
