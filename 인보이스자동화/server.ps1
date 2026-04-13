$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Server listening on http://localhost:$port/"
    Write-Host "For internal network sharing (if firewall allows), you might need to use node/python instead, as HttpListener requires Admin to bind to network IPs."
} catch {
    Write-Host "Failed to start server. Port $port might be in use."
    exit
}

$basePath = (Get-Location).Path

while ($true) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path $basePath $localPath.Replace("/", "\")
        $filePath = [System.IO.Path]::GetFullPath($filePath)
        
        if ($filePath.StartsWith($basePath) -and (Test-Path $filePath -PathType Leaf)) {
            $buffer = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $buffer.Length
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
            }
            
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # ignore context errors
    }
}
