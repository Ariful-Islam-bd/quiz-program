# ============================================================
# Backend API Test Suite
# Version: 1.1.0 - Fixed string terminator + emoji parsing
# ============================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$BaseUrl = "https://quiz-program.onrender.com/api/v1"
)

$script:passed = 0
$script:failed = 0
$script:warnings = 0

function Write-Pass {
    param([string]$Name, [string]$Details = "")
    Write-Host ("  [PASS] " + $Name) -ForegroundColor Green
    if ($Details) { Write-Host ("         " + $Details) -ForegroundColor DarkGray }
    $script:passed++
}

function Write-Fail {
    param([string]$Name, [string]$Details = "")
    Write-Host ("  [FAIL] " + $Name) -ForegroundColor Red
    if ($Details) { Write-Host ("         " + $Details) -ForegroundColor DarkGray }
    $script:failed++
}

function Write-Warn {
    param([string]$Name, [string]$Details = "")
    Write-Host ("  [WARN] " + $Name) -ForegroundColor Yellow
    if ($Details) { Write-Host ("         " + $Details) -ForegroundColor DarkGray }
    $script:warnings++
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "===========================================================" -ForegroundColor Cyan
    Write-Host ("  " + $Title) -ForegroundColor Cyan
    Write-Host "===========================================================" -ForegroundColor Cyan
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int[]]$ExpectedStatus = @(200)
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
        $code = [int]$response.StatusCode
        if ($ExpectedStatus -contains $code) {
            Write-Pass -Name $Name -Details ("HTTP " + $code)
            return @{ Success = $true; Status = $code; Content = $response.Content; Data = ($response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue) }
        } else {
            Write-Fail -Name $Name -Details ("Expected " + ($ExpectedStatus -join ",") + " got " + $code)
            return @{ Success = $false; Status = $code }
        }
    } catch {
        $code = $null
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($code -and ($ExpectedStatus -contains $code)) {
            Write-Pass -Name $Name -Details ("HTTP " + $code + " (expected)")
            return @{ Success = $true; Status = $code }
        }
        Write-Fail -Name $Name -Details $_.Exception.Message
        return @{ Success = $false; Status = $code }
    }
}

# ============================================================
# START
# ============================================================
Clear-Host
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "  Backend API Test Suite v1.1.0" -ForegroundColor Magenta
Write-Host ("  Target: " + $BaseUrl) -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host ("Started at: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor Gray

# ============================================================
# SECTION 1: Health
# ============================================================
Write-Section "1. Health Endpoint"

$health = Test-Endpoint -Name "GET /health -> 200 OK" -Url ($BaseUrl + "/health")

if ($health.Success -and $health.Data) {
    $h = $health.Data
    if ($h.status -eq "healthy") {
        Write-Pass -Name "Health status is 'healthy'" -Details ("mongodb: " + $h.mongodb)
    } else {
        Write-Fail -Name "Health status is 'healthy'" -Details ("Got: " + $h.status)
    }
    if ($h.mongodb -eq "connected") {
        Write-Pass -Name "MongoDB connection is 'connected'" -Details ("uptime: " + $h.uptime + "s")
    } else {
        Write-Fail -Name "MongoDB connection is 'connected'" -Details ("Got: " + $h.mongodb)
    }
}

# ============================================================
# SECTION 2: Content API - Public
# ============================================================
Write-Section "2. Content API - Public Endpoints"

# 2.1 List contents
$list = Test-Endpoint -Name "GET /content -> list" -Url ($BaseUrl + "/content?limit=5")
if ($list.Success -and $list.Data) {
    $total = $list.Data.total
    $count = $list.Data.count
    if ($total -eq 56) {
        Write-Pass -Name "Total content count = 56" -Details ("Got: " + $total)
    } elseif ($total -gt 0) {
        Write-Warn -Name "Total content count" -Details ("Expected 56, got " + $total)
    } else {
        Write-Fail -Name "Total content count" -Details ("Got: " + $total)
    }
    if ($count -ge 1 -and $count -le 5) {
        Write-Pass -Name "Pagination works (limit=5)" -Details ("Returned: " + $count)
    } else {
        Write-Fail -Name "Pagination works" -Details ("Returned: " + $count)
    }
}

# 2.2 Get by topicId
$topicId = "HSC-Math-3A-All-Q"
$byId = Test-Endpoint -Name ("GET /content/" + $topicId) -Url ($BaseUrl + "/content/" + $topicId)
if ($byId.Success -and $byId.Data) {
    if ($byId.Data.data.html) {
        Write-Pass -Name "Content payload has HTML" -Details ("Length: " + $byId.Data.data.html.Length + " chars")
    } else {
        Write-Fail -Name "Content payload has HTML"
    }
}

# 2.3 404 for missing
Test-Endpoint -Name "GET /content/INVALID -> 404" -Url ($BaseUrl + "/content/INVALID-ID-XYZ") -ExpectedStatus @(404) | Out-Null

# 2.4 Categories
$cats = Test-Endpoint -Name "GET /content/categories" -Url ($BaseUrl + "/content/categories")
if ($cats.Success -and $cats.Data) {
    $d = $cats.Data.data
    if ($d.boards -and $d.subjects) {
        Write-Pass -Name "Categories has boards + subjects" -Details ("boards: " + $d.boards.Count + ", subjects: " + $d.subjects.Count)
    } else {
        Write-Fail -Name "Categories structure"
    }
}

# 2.5 Stats
$stats = Test-Endpoint -Name "GET /content/stats/summary" -Url ($BaseUrl + "/content/stats/summary")
if ($stats.Success -and $stats.Data) {
    $s = $stats.Data.data
    if ($s.active -eq 56) {
        Write-Pass -Name "Stats: 56 active contents" -Details ("total: " + $s.total + ", active: " + $s.active)
    } elseif ($s.active -gt 0) {
        Write-Warn -Name "Stats: active count" -Details ("Expected 56, got " + $s.active)
    } else {
        Write-Fail -Name "Stats: active count" -Details ("Got: " + $s.active)
    }
}

# 2.6 Filter by board
$filtered = Test-Endpoint -Name "GET /content?board=HSC" -Url ($BaseUrl + "/content?board=HSC&limit=10")
if ($filtered.Success -and $filtered.Data) {
    if ($filtered.Data.count -gt 0) {
        Write-Pass -Name "Board filter works" -Details ("HSC: " + $filtered.Data.count + " results")
    } else {
        Write-Fail -Name "Board filter works" -Details "No results"
    }
}

# ============================================================
# SECTION 3: Auth API
# ============================================================
Write-Section "3. Auth API - Authorization Checks"

# 3.1 Protected route without token -> 401
Test-Endpoint -Name "GET /auth/me (no token) -> 401" -Url ($BaseUrl + "/auth/me") -ExpectedStatus @(401) | Out-Null

# 3.2 Invalid login -> 401
try {
    $badLogin = Invoke-WebRequest -Uri ($BaseUrl + "/auth/login") -Method POST -UseBasicParsing -TimeoutSec 30 `
        -ContentType "application/json" `
        -Body '{"email":"wrong@example.com","password":"wrongpass"}'
    Write-Fail -Name "POST /auth/login (invalid) -> 401" -Details ("Got: " + $badLogin.StatusCode)
} catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($code -eq 401) {
        Write-Pass -Name "POST /auth/login (invalid) -> 401" -Details "HTTP 401"
    } else {
        Write-Fail -Name "POST /auth/login (invalid) -> 401" -Details ("Got: " + $code)
    }
}

# ============================================================
# SECTION 4: Content Admin Authorization
# ============================================================
Write-Section "4. Content API - Admin Authorization"

try {
    $unauthPost = Invoke-WebRequest -Uri ($BaseUrl + "/content") -Method POST -UseBasicParsing -TimeoutSec 30 `
        -ContentType "application/json" `
        -Body '{"topicId":"TEST-001","name":"Test","html":"<p>x</p>","category":{"board":"b","className":"c","subject":"s","chapter":"ch","topic":"t"}}'
    Write-Fail -Name "POST /content (no auth) -> 401" -Details ("Got: " + $unauthPost.StatusCode)
} catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($code -eq 401) {
        Write-Pass -Name "POST /content (no auth) -> 401" -Details "HTTP 401"
    } else {
        Write-Fail -Name "POST /content (no auth) -> 401" -Details ("Got: " + $code)
    }
}

# ============================================================
# SECTION 5: 404 Handler
# ============================================================
Write-Section "5. Error Handling"

Test-Endpoint -Name "GET /nonexistent -> 404" -Url ($BaseUrl + "/nonexistent-xyz-123") -ExpectedStatus @(404) | Out-Null

# ============================================================
# SUMMARY
# ============================================================
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host "  TEST SUMMARY" -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host ("  Passed:   " + $script:passed) -ForegroundColor Green
Write-Host ("  Warnings: " + $script:warnings) -ForegroundColor Yellow
Write-Host ("  Failed:   " + $script:failed) -ForegroundColor Red
Write-Host ""

$total = $script:passed + $script:failed + $script:warnings
if ($total -gt 0) {
    $rate = [math]::Round(($script:passed / $total) * 100, 1)
    Write-Host ("  Success Rate: " + $rate + "%") -ForegroundColor $(if ($rate -ge 90) { "Green" } elseif ($rate -ge 70) { "Yellow" } else { "Red" })
}

Write-Host ""
Write-Host ("Finished at: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor Gray
Write-Host ""

if ($script:failed -gt 0) { exit 1 } else { exit 0 }