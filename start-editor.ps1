param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$expectedFolder = [IO.Path]::GetFullPath((Join-Path $projectDir 'dist'))
$editorUrl = 'http://127.0.0.1:8765/editor.html'
$sessionUrl = 'http://127.0.0.1:8765/__portfolio/session'
function Get-EditorSession {
    try { return Invoke-RestMethod -Uri $sessionUrl -TimeoutSec 1 } catch { return $null }
}
$session = Get-EditorSession
if ($session -and ($session.app -ne 'owen-portfolio-editor' -or $session.folder -ne $expectedFolder)) {
    throw 'Port 8765 is being used by another service. Close that service, then open Edit Website again.'
}
if (-not $session) {
    $pythonCandidates = @('C:/Users/mocha/AppData/Local/Programs/Python/Python311/python.exe', 'C:/Users/mocha/AppData/Local/Programs/Python/Python313/python.exe')
    $python = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $python) { $python = (Get-Command python -ErrorAction SilentlyContinue).Source }
    if (-not $python) { throw 'Python is required to open the local editor.' }
    $serverScript = Join-Path $projectDir 'editor_server.py'
    $stdoutLog = Join-Path $projectDir 'editor-server-output.log'
    $stderrLog = Join-Path $projectDir 'editor-server-errors.log'
    $process = Start-Process -FilePath $python -ArgumentList @(('"' + $serverScript + '"'), '--port', '8765') -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        $session = Get-EditorSession
        if ($session) { break }
        if ($process.HasExited) { throw 'The editor could not start. See editor-server-errors.log.' }
        Start-Sleep -Milliseconds 200
    }
    if (-not $session) { throw 'The local editor did not start in time.' }
    if ($session.app -ne 'owen-portfolio-editor' -or $session.folder -ne $expectedFolder) {
        Stop-Process -Id $process.Id
        throw 'The local editor responded with an unexpected folder.'
    }
}
if (-not $NoOpen) { Start-Process $editorUrl }
Write-Output $editorUrl
