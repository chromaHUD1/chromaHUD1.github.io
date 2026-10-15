param([string]$Message = 'Update engineering portfolio')
$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
Set-Location -LiteralPath $projectDir
$pythonCandidates = @('C:/Users/mocha/AppData/Local/Programs/Python/Python311/python.exe', 'C:/Users/mocha/AppData/Local/Programs/Python/Python313/python.exe')
$python = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $python) { $python = (Get-Command python -ErrorAction Stop).Source }
& $python (Join-Path $projectDir 'tools/prepare_pages.py')
if ($LASTEXITCODE -ne 0) { throw 'Public build failed; nothing was published.' }
$manifest = Get-Content -LiteralPath (Join-Path $projectDir '.pages-manifest.json') -Raw | ConvertFrom-Json
$sourceFiles = @($manifest.source_files)
$extraFiles = @('.gitignore','.gitattributes','.github/workflows/pages.yml','README.md','EDITING.md','editor_server.py','start-editor.ps1','publish.ps1','Publish Website.cmd','requirements-publish.txt','portfolio-qr.png','portfolio-qr.svg','portfolio-qr-url.txt','tools/prepare_pages.py','tools/generate_qr.py','tools/verify_public.py')
$toStage = @($sourceFiles + $extraFiles | Where-Object { Test-Path -LiteralPath (Join-Path $projectDir $_) })
foreach ($relative in $toStage) {
    $target = [IO.Path]::GetFullPath((Join-Path $projectDir $relative))
    if (-not $target.StartsWith($projectDir + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'A source file leaves the project folder.' }
    if ((Get-Item -LiteralPath $target).Length -gt 95MB) { throw ('File exceeds GitHub limit: ' + $relative) }
}
& git add -f -- @toStage
if ($LASTEXITCODE -ne 0) { throw 'Could not stage the portfolio source.' }
& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
    & git commit -m $Message
    if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' }
} elseif ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged changes.' }
& git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'Push failed. No remote content was replaced; resolve the reported Git issue before retrying.' }
Write-Output 'Pushed. GitHub Actions will deploy https://chromahud1.github.io/'
Write-Output 'Deployment status: https://github.com/chromaHUD1/chromaHUD1.github.io/actions'
