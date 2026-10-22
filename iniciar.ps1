# iniciar.ps1 - Servidor HTTP para o XuxuMenu
# Obs.: mantenha este arquivo so com caracteres ASCII (sem acentos).
# O Windows PowerShell 5.1 le scripts sem BOM como ANSI.

$port = 8090
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- "Enviar para o celular" (QR Code) ---
# Porta aberta na rede local SO para entregar a imagem do cardapio ao celular.
# Ela nao serve nenhum arquivo do projeto: apenas /c/<codigo> e /c/<codigo>.jpg.
$portaCelular    = 8091
$validadeMinutos = 10      # validade do link do QR Code
$maxImagens      = 5       # imagens guardadas ao mesmo tempo (em memoria)
$tamanhoMaximo   = 10MB

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
} catch {
    # Porta ocupada (outro programa ou servidor antigo): nao sobe uma copia quebrada
    Write-Host "Nao foi possivel usar a porta $port. Rode o parar.bat e tente de novo."
    exit 1
}

# Salva o PID para poder parar depois (so depois de o servidor subir de fato)
$pid | Out-File -FilePath "$env:TEMP\xuxumenu.pid" -Force

# Abre o navegador (so aqui: o iniciar.bat nao abre mais, para nao abrir duas vezes)
Start-Process "http://localhost:$port"

Write-Host "XuxuMenu rodando em http://localhost:$port"
Write-Host "Para parar, execute o parar.bat ou feche esta janela."

# ============================================================
#  Arquivos do cardapio (somente para o proprio PC)
# ============================================================

function Atender-Local($context) {
    # O cardapio e o admin so atendem o proprio computador
    if (-not $context.Request.IsLocal) {
        $context.Response.StatusCode = 403
        return
    }

    $path = $context.Request.Url.AbsolutePath

    if ($path -eq '/api/compartilhar') {
        Receber-Imagem $context
        return
    }

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
}

# ============================================================
#  Enviar para o celular
# ============================================================

$imagens  = @{}      # codigo -> @{ Bytes; Nome; ExpiraEm }
$tcp      = $null    # porta da rede local, ligada no primeiro uso
$tcpTask  = $null

function Responder-Json($context, $status, $obj) {
    $bytes = [Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress))
    $context.Response.StatusCode = $status
    $context.Response.ContentType = 'application/json; charset=utf-8'
    $context.Response.Headers['Cache-Control'] = 'no-store'
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Remover-Expiradas {
    $agora = Get-Date
    foreach ($k in @($imagens.Keys)) {
        if ($imagens[$k].ExpiraEm -lt $agora) { $imagens.Remove($k) }
    }
}

function Novo-Codigo {
    $b = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($b)
    $rng.Dispose()
    return (($b | ForEach-Object { $_.ToString('x2') }) -join '')
}

function Test-IpPrivado([string]$ip) {
    if ($ip.StartsWith('10.') -or $ip.StartsWith('192.168.')) { return $true }
    if ($ip -match '^172\.(\d+)\.') { $n = [int]$Matches[1]; return ($n -ge 16 -and $n -le 31) }
    return $false
}

# IP do PC na rede local.
# 1o: o IP da placa usada pela rota padrao (a mesma que sai para o roteador/Wi-Fi).
#     Um socket UDP "conectado" so consulta a tabela de rotas: nenhum pacote e enviado.
# 2o: se nao houver rota padrao, escolhe pela lista de placas, ignorando as virtuais.
function Get-IpRede {
    try {
        $sock = New-Object System.Net.Sockets.Socket(
            [System.Net.Sockets.AddressFamily]::InterNetwork,
            [System.Net.Sockets.SocketType]::Dgram,
            [System.Net.Sockets.ProtocolType]::Udp)
        $sock.Connect('8.8.8.8', 53)
        $ip = $sock.LocalEndPoint.Address.ToString()
        $sock.Close()
        if ($ip -and -not $ip.StartsWith('127.') -and -not $ip.StartsWith('169.254.') -and $ip -ne '0.0.0.0') {
            return $ip
        }
    } catch { }
    return (Get-IpRedePorPlaca)
}

function Get-IpRedePorPlaca {
    $virtuais = 'Hyper-V|vEthernet|VirtualBox|VMware|Virtual|TAP|TUN|VPN|WSL|Docker|Bluetooth|Loopback'
    $candidatos = @()
    foreach ($nic in [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
        if ($nic.OperationalStatus -ne 'Up') { continue }
        if ($nic.NetworkInterfaceType -eq 'Loopback') { continue }
        if (($nic.Name + ' ' + $nic.Description) -match $virtuais) { continue }
        $props = $nic.GetIPProperties()
        $gateways = @($props.GatewayAddresses | Where-Object {
            $_.Address.AddressFamily -eq 'InterNetwork' -and $_.Address.ToString() -ne '0.0.0.0'
        })
        foreach ($ua in $props.UnicastAddresses) {
            if ($ua.Address.AddressFamily -ne 'InterNetwork') { continue }
            $s = $ua.Address.ToString()
            if ($s.StartsWith('127.') -or $s.StartsWith('169.254.')) { continue }
            $candidatos += [pscustomobject]@{
                Ip      = $s
                Gateway = ($gateways.Count -gt 0)
                Privado = (Test-IpPrivado $s)
            }
        }
    }
    $melhor = $candidatos |
        Sort-Object @{ Expression = { $_.Gateway }; Descending = $true },
                    @{ Expression = { $_.Privado }; Descending = $true } |
        Select-Object -First 1
    if ($melhor) { return $melhor.Ip }
    return $null
}

function Iniciar-PortaCelular {
    if ($script:tcp) { return $true }
    try {
        $t = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $portaCelular)
        $t.Start()
        $script:tcp = $t
        $script:tcpTask = $t.AcceptTcpClientAsync()
        return $true
    } catch {
        return $false
    }
}

# POST /api/compartilhar  (corpo = JPG gerado pelo navegador)
function Receber-Imagem($context) {
    $req = $context.Request

    if ($req.HttpMethod -ne 'POST') { Responder-Json $context 405 @{ erro = 'metodo' }; return }

    # Cabecalho proprio + origem: impede que outros sites abertos no navegador usem esta rota
    $origem = $req.Headers['Origin']
    if ($req.Headers['X-XuxuMenu'] -ne '1' -or ($origem -and $origem -ne "http://localhost:$port")) {
        Responder-Json $context 403 @{ erro = 'proibido' }; return
    }
    if ($req.ContentLength64 -le 0 -or $req.ContentLength64 -gt $tamanhoMaximo) {
        Responder-Json $context 413 @{ erro = 'tamanho' }; return
    }

    $ms = New-Object IO.MemoryStream
    $req.InputStream.CopyTo($ms)
    $bytes = $ms.ToArray()
    $ms.Dispose()

    # Precisa ser um JPG (FF D8 FF)
    if ($bytes.Length -lt 3 -or $bytes[0] -ne 0xFF -or $bytes[1] -ne 0xD8 -or $bytes[2] -ne 0xFF) {
        Responder-Json $context 415 @{ erro = 'formato' }; return
    }

    $ip = Get-IpRede
    if (-not $ip) { Responder-Json $context 503 @{ erro = 'sem_rede' }; return }

    if (-not (Iniciar-PortaCelular)) { Responder-Json $context 503 @{ erro = 'porta_ocupada'; porta = $portaCelular }; return }

    Remover-Expiradas
    while ($imagens.Count -ge $maxImagens) {
        $maisAntiga = $imagens.GetEnumerator() | Sort-Object { $_.Value.ExpiraEm } | Select-Object -First 1
        $imagens.Remove($maisAntiga.Key)
    }

    $codigo = Novo-Codigo
    $imagens[$codigo] = @{
        Bytes    = $bytes
        Nome     = 'cardapio-' + (Get-Date -Format 'yyyy-MM-dd') + '.jpg'
        ExpiraEm = (Get-Date).AddMinutes($validadeMinutos)
    }

    Responder-Json $context 200 @{
        url              = "http://${ip}:$portaCelular/c/$codigo"
        validadeSegundos = $validadeMinutos * 60
    }
}

function Pagina-Celular($codigo, $nome) {
    return @"
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Card&aacute;pio - Cozinha da Xuxu</title>
<style>
html{background:#490408}
body{margin:0;padding:16px;background:#490408;color:#fff;font-family:Arial,Helvetica,sans-serif;text-align:center}
img{display:block;max-width:100%;max-height:68vh;margin:0 auto;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.45)}
a{display:block;max-width:360px;margin:18px auto 10px;padding:16px;border-radius:10px;background:#b31217;color:#fff;font-size:18px;font-weight:bold;text-decoration:none}
p{max-width:360px;margin:0 auto;font-size:14px;line-height:1.4;opacity:.85}
</style></head><body>
<img src="/c/$codigo.jpg" alt="Card&aacute;pio">
<a href="/c/$codigo.jpg?baixar" download="$nome">Baixar imagem</a>
<p>Se o bot&atilde;o n&atilde;o funcionar, toque e segure a imagem e escolha salvar.</p>
</body></html>
"@
}

function Pagina-Aviso($titulo, $texto) {
    return @"
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>$titulo</title>
<style>body{margin:0;padding:40px 20px;background:#490408;color:#fff;font-family:Arial,Helvetica,sans-serif;text-align:center}h1{font-size:22px}p{font-size:16px;line-height:1.4;opacity:.85}</style>
</head><body><h1>$titulo</h1><p>$texto</p></body></html>
"@
}

# Atende o celular. So entende GET /c/<codigo> e GET /c/<codigo>.jpg
function Atender-Celular($cliente) {
    try {
        $cliente.ReceiveTimeout = 3000
        $cliente.SendTimeout = 10000
        $stream = $cliente.GetStream()
        $leitor = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII)

        $linha = $leitor.ReadLine()
        for ($n = 0; $n -lt 100; $n++) {           # le e ignora os cabecalhos
            $h = $leitor.ReadLine()
            if ([string]::IsNullOrEmpty($h)) { break }
        }

        $status = 404
        $tipo   = 'text/html; charset=utf-8'
        $extra  = ''
        $corpo  = $null

        if ($linha -match '^GET /c/([0-9a-f]{32})(\.jpg)?(\?\S*)? HTTP/1\.[01]$') {
            $codigo = $Matches[1]
            $ehJpg  = [bool]$Matches[2]
            $baixar = ($Matches[3] -eq '?baixar')
            Remover-Expiradas
            $item = $imagens[$codigo]
            if (-not $item) {
                $status = 410
                $corpo  = Pagina-Aviso 'Link expirado' 'Gere um novo QR Code no computador do caixa.'
            } elseif ($ehJpg) {
                $status = 200
                $tipo   = 'image/jpeg'
                $corpo  = $item.Bytes
                if ($baixar) { $extra = "Content-Disposition: attachment; filename=`"$($item.Nome)`"`r`n" }
            } else {
                $status = 200
                $corpo  = Pagina-Celular $codigo $item.Nome
            }
        } else {
            $corpo = Pagina-Aviso 'Nada por aqui' 'Escaneie o QR Code mostrado no computador do caixa.'
        }

        if ($corpo -is [string]) { $corpo = [Text.Encoding]::UTF8.GetBytes($corpo) }
        $texto = switch ($status) { 200 { 'OK' } 410 { 'Gone' } default { 'Not Found' } }
        $cab = "HTTP/1.1 $status $texto`r`n" +
               "Content-Type: $tipo`r`n" +
               "Content-Length: $($corpo.Length)`r`n" +
               "Cache-Control: no-store`r`n" +
               "X-Content-Type-Options: nosniff`r`n" +
               $extra +
               "Connection: close`r`n`r`n"
        $cb = [Text.Encoding]::ASCII.GetBytes($cab)
        $stream.Write($cb, 0, $cb.Length)
        $stream.Write($corpo, 0, $corpo.Length)
        $stream.Flush()
    } catch {
        # celular desconectou ou demorou demais: ignora
    } finally {
        $cliente.Close()
    }
}

# ============================================================
#  Loop principal - espera o PC (porta 8090) e, se ligada, a porta do celular
# ============================================================

$ctxTask = $listener.GetContextAsync()

while ($listener.IsListening) {
    if ($script:tcpTask) {
        $tarefas = [System.Threading.Tasks.Task[]]@($ctxTask, $script:tcpTask)
    } else {
        $tarefas = [System.Threading.Tasks.Task[]]@($ctxTask)
    }

    $i = [System.Threading.Tasks.Task]::WaitAny($tarefas, 1000)
    if ($i -lt 0) { continue }

    if ($i -eq 0) {
        try { $context = $ctxTask.Result } catch { break }   # servidor parado
        $ctxTask = $listener.GetContextAsync()
        try {
            Atender-Local $context
        } catch {
            try { $context.Response.StatusCode = 500 } catch {}
        }
        try { $context.Response.Close() } catch {}
    } else {
        $cliente = $null
        try { $cliente = $script:tcpTask.Result } catch {}
        $script:tcpTask = $script:tcp.AcceptTcpClientAsync()
        if ($cliente) { Atender-Celular $cliente }
    }
}

# Limpeza
if ($tcp) { $tcp.Stop() }
if (Test-Path "$env:TEMP\xuxumenu.pid") {
    Remove-Item "$env:TEMP\xuxumenu.pid" -Force
}
