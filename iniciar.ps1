# iniciar.ps1 — Servidor HTTP para o XuxuMenu

$port = 8090
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Salva o PID para poder parar depois
$pid | Out-File -FilePath "$env:TEMP\xuxumenu.pid" -Force

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

# Abre o navegador
Start-Process "http://localhost:$port"

Write-Host "XuxuMenu rodando em http://localhost:$port"
Write-Host "Para parar, execute o parar.bat ou feche esta janela."

# Loop principal — atende requisições HTTP
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = $context.Request.Url.AbsolutePath
    
    if ($path -eq '/') { $path = '/index.html' }
    
    $file = Join-Path $root $path.TrimStart('/')
    
    if (Test-Path $file -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file)
        
        $mime = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.js'   { 'application/javascript; charset=utf-8' }
            '.png'  { 'image/png' }
            '.jpg'  { 'image/jpeg' }
            '.jpeg' { 'image/jpeg' }
            '.ico'  { 'image/x-icon' }
            default { 'application/octet-stream' }
        }
        
        $context.Response.ContentType = $mime
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
    }
    
    $context.Response.Close()
}

# Limpeza
if (Test-Path "$env:TEMP\xuxumenu.pid") {
    Remove-Item "$env:TEMP\xuxumenu.pid" -Force
}
