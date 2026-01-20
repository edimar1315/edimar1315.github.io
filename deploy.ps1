<#
Deploy PowerShell para GitHub Pages


Observações:
  - Requer Git instalado e disponível no PATH.
  - Se o push falhar por autenticação, execute: gh auth login (recomendado) ou configure suas credenciais Git/SSH.
#>

param(
    [string]$RepoUrl = "https://github.com/edimar1315/edimar1315.github.io.git",
    [string]$Branch = "main",
    [string]$CommitMsg = "Site do portfólio / currículo — deploy automático"
)

function Run-Git {
    param([string[]]$Args)
    & git @Args
    return $LASTEXITCODE
}

Write-Host "==> Deploy GitHub Pages (PowerShell) — Início" -ForegroundColor Cyan

# 1) .gitignore (backup se já existir)
$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $bak = ".gitignore.bak"
    Write-Host "-> .gitignore já existe — criando backup em $bak"
    try { Copy-Item -Path $gitignorePath -Destination $bak -Force } catch {
        Write-Warning "Falha ao fazer backup de .gitignore: $_"
    }
} else {
    Write-Host "-> Criando .gitignore com regras recomendadas"
    $gitignoreContent = @"
# Visual Studio
.vs/
*.suo
*.user
*.userosscache
*.sln.docstates

# Build outputs
bin/
obj/
publish/

# Rider/IDE
.idea/
*.iml

# VS Code
.vscode/

# OS
.DS_Store
Thumbs.db

# Node
node_modules/

# Logs
*.log

# Secrets / env
.env
"@
    try {
        $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8 -Force
    } catch {
        Write-Warning "Não foi possível criar .gitignore: $_"
    }
}

# 2) .nojekyll
if (-not (Test-Path ".nojekyll")) {
    Write-Host "-> Criando .nojekyll"
    try { New-Item -Path ".nojekyll" -ItemType File -Force | Out-Null } catch {
        Write-Warning "Falha ao criar .nojekyll: $_"
    }
} else {
    Write-Host "-> .nojekyll já existe"
}

# 3) Inicializar git se necessário
if (-not (Test-Path ".git")) {
    Write-Host "-> Inicializando repositório git local"
    if (Run-Git init -ne 0) {
        Write-Warning "git init falhou. Verifique se o git está instalado e disponível no PATH."
        exit 1
    }
} else {
    Write-Host "-> Repositório git já inicializado"
}

# 4) Adicionar .gitignore e .nojekyll primeiro
Write-Host "-> Adicionando .gitignore e .nojekyll"
if (Run-Git add ".gitignore" ".nojekyll" -ne 0) {
    Write-Warning "git add .gitignore/.nojekyll falhou. Verifique permissões."
}

# 5) Tentar adicionar tudo (mas .vs está no .gitignore agora)
Write-Host "-> Tentando 'git add .'"
$addExit = Run-Git add "."
if ($addExit -eq 0) {
    Write-Host "-> git add . concluído com sucesso"
} else {
    Write-Warning "-> git add . falhou (possível bloqueio de arquivos como .vs). Tentando adicionar somente arquivos do site."
    $filesToAdd = @("index.html","style.css","script.js","README.md",".nojekyll",".gitignore")
    $addedAny = $false
    foreach ($f in $filesToAdd) {
        if (Test-Path $f) {
            Write-Host "   -> adicionando $f"
            if (Run-Git add $f -eq 0) {
                $addedAny = $true
            } else {
                Write-Warning "Falha ao adicionar $f"
            }
        } else {
            Write-Host "   -> não encontrado: $f"
        }
    }
    if (-not $addedAny) {
        Write-Error "Nenhum arquivo do site foi adicionado. Possíveis causas: arquivos bloqueados (.vs) ou permissões. Feche o Visual Studio e tente novamente."
        Write-Host "Se o problema for .vs rastreado no repositório, rode (após revisar):"
        Write-Host "  git rm -r --cached .vs"
        Write-Host "  git commit -m 'Remove .vs from repo' && git push"
        exit 1
    }
}

# 6) Commit se houver mudanças staged
# git diff --cached --quiet retorna 0 se NÃO houver diferenças (nada para commitar), 1 se há mudanças
Run-Git "diff" "--cached" "--quiet"
$diffCachedExit = $LASTEXITCODE
if ($diffCachedExit -ne 0) {
    Write-Host "-> Fazendo commit: $CommitMsg"
    if (Run-Git commit "-m" $CommitMsg -ne 0) {
        Write-Warning "git commit falhou. Verifique o estado do repositório."
    }
} else {
    Write-Host "-> Nada novo para commitar"
}

# 7) Ajustar branch principal
Write-Host "-> Ajustando branch para '$Branch'"
Run-Git branch -M $Branch | Out-Null

# 8) Configurar remote origin
$remoteUrlExit = Run-Git remote get-url origin
if ($remoteUrlExit -eq 0) {
    Write-Host "-> Remote 'origin' já existe. Atualizando URL para $RepoUrl"
    Run-Git remote set-url origin $RepoUrl | Out-Null
} else {
    Write-Host "-> Adicionando remote origin $RepoUrl"
    if (Run-Git remote add origin $RepoUrl -ne 0) {
        Write-Warning "git remote add origin falhou. Verifique a URL e permissões."
    }
}

# 9) Push
Write-Host "-> Enviando para origin/$Branch (push)..."
$pushExit = Run-Git push "-u" "origin" $Branch
if ($pushExit -eq 0) {
    Write-Host "-> Push realizado com sucesso." -ForegroundColor Green
    Write-Host "   Acesse: https://edimar1315.github.io  (aguarde alguns minutos enquanto o Pages publica)"
} else {
    Write-Warning "Falha no push (código $pushExit). Possíveis ações:"
    Write-Host " - Autentique com GitHub CLI: gh auth login"
    Write-Host " - Configure SSH e use a URL SSH: git@github.com:edimar1315/edimar1315.github.io.git"
    Write-Host " - Verifique se o repositório remoto existe e se você tem permissão para push"
    exit 1
}

Write-Host "==> Deploy concluído" -ForegroundColor Cyan