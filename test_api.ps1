# test_api.ps1 - Automated verification of CampusGig REST API endpoints
$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

function Call-Api {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus = 200
    )

    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $jsonBody = if ($Body) { $Body | ConvertTo-Json -Compress } else { $null }

    try {
        $params = @{
            Uri = "$baseUrl$Path"
            Method = $Method
            Headers = $headers
        }
        if ($jsonBody) {
            $params["Body"] = $jsonBody
        }

        $response = Invoke-RestMethod @params
        return $response
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $respBody = $reader.ReadToEnd()
            if ($statusCode -eq $ExpectedStatus) {
                return ($respBody | ConvertFrom-Json)
            }
            Write-Host "Unexpected status $statusCode (expected $ExpectedStatus): $respBody" -ForegroundColor Red
            throw $_
        } else {
            throw $_
        }
    }
}

Write-Host "=== TEST 1: Service Root & Health ===" -ForegroundColor Cyan
$root = Call-Api -Path "/"
Write-Host "Service: $($root.service) | Status: $($root.status)" -ForegroundColor Green

Write-Host "`n=== TEST 2: Freelancer Registration with invalid domain (Should fail) ===" -ForegroundColor Cyan
$failReg = Call-Api -Path "/api/register" -Method "POST" -ExpectedStatus 400 -Body @{
    name = "Non VIT Student"
    email = "student@gmail.com"
    password = "pass"
    role = "Freelancer"
}
Write-Host "Expected failure caught: $($failReg.error)" -ForegroundColor Yellow

Write-Host "`n=== TEST 3: Register Valid Users ===" -ForegroundColor Cyan
$clientEmail = "innovate_$(Get-Random)@gmail.com"
$clientReg = Call-Api -Path "/api/register" -Method "POST" -ExpectedStatus 201 -Body @{
    name = "Innovate Labs"
    email = $clientEmail
    password = "password123"
    role = "Client"
}
Write-Host "Client registered: ID $($clientReg.user.id) - $($clientReg.user.name)" -ForegroundColor Green
$clientToken = $clientReg.token

$freelancerEmail = "student_$(Get-Random)@vit.edu"
$freeReg = Call-Api -Path "/api/register" -Method "POST" -ExpectedStatus 201 -Body @{
    name = "Aditya Kulkarni"
    email = $freelancerEmail
    password = "password123"
    role = "Freelancer"
}
Write-Host "Freelancer registered: ID $($freeReg.user.id) - $($freeReg.user.name)" -ForegroundColor Green
$freeToken = $freeReg.token

$adminEmail = "admin_$(Get-Random)@campusgig.com"
$adminReg = Call-Api -Path "/api/register" -Method "POST" -ExpectedStatus 201 -Body @{
    name = "Campus Admin"
    email = $adminEmail
    password = "adminpassword"
    role = "Admin"
}
Write-Host "Admin registered: ID $($adminReg.user.id) - $($adminReg.user.name)" -ForegroundColor Green
$adminToken = $adminReg.token

Write-Host "`n=== TEST 4: Login Verification ===" -ForegroundColor Cyan
$loginRes = Call-Api -Path "/api/login" -Method "POST" -Body @{
    email = $clientEmail
    password = "password123"
}
Write-Host "Login successful for $($loginRes.user.name) (Token: $($loginRes.token.Substring(0,10))...)" -ForegroundColor Green

Write-Host "`n=== TEST 5: Post Job by Client ===" -ForegroundColor Cyan
$postJob = Call-Api -Path "/api/jobs" -Method "POST" -ExpectedStatus 201 -Token $clientToken -Body @{
    title = "Mobile Flutter App"
    description = "Create cross-platform campus event app"
    budget = 150.0
}
$jobId = $postJob.job.id
Write-Host "Job posted: #$jobId - $($postJob.job.title) ($$($postJob.job.budget))" -ForegroundColor Green

Write-Host "`n=== TEST 6: Browse & Search Jobs ===" -ForegroundColor Cyan
$allJobs = Call-Api -Path "/api/jobs"
Write-Host "Open jobs count: $($allJobs.Count)" -ForegroundColor Green
$searchRes = Call-Api -Path "/api/jobs?search=flutter"
Write-Host "Keyword search matching jobs: $($searchRes.Count)" -ForegroundColor Green

Write-Host "`n=== TEST 7: Freelancer Applies for Job ===" -ForegroundColor Cyan
$applyRes = Call-Api -Path "/api/jobs/$jobId/apply" -Method "POST" -Token $freeToken -Body @{
    proposedPrice = 140.0
}
Write-Host "Apply response: $($applyRes.message)" -ForegroundColor Green

Write-Host "`n=== TEST 8: Client Views Applicants ===" -ForegroundColor Cyan
$applicants = Call-Api -Path "/api/jobs/$jobId/applicants" -Token $clientToken
Write-Host "Applicants for Job #$($jobId): $($applicants.Count)" -ForegroundColor Green
Write-Host "Applicant 0: $($applicants[0].freelancerName) ($$($applicants[0].proposedPrice)) - Status: $($applicants[0].status)" -ForegroundColor Green

Write-Host "`n=== TEST 9: Client Hires Freelancer ===" -ForegroundColor Cyan
$freelancerId = $freeReg.user.id
$hireRes = Call-Api -Path "/api/jobs/$jobId/hire" -Method "POST" -Token $clientToken -Body @{
    freelancerId = $freelancerId
}
Write-Host "Hire response: $($hireRes.message)" -ForegroundColor Green

Write-Host "`n=== TEST 10: Freelancer Checks Applications (/api/applications/me) ===" -ForegroundColor Cyan
$myApps = Call-Api -Path "/api/applications/me" -Token $freeToken
Write-Host "Freelancer applications: $($myApps.Count), Status: $($myApps[0].status), Job Status: $($myApps[0].jobStatus)" -ForegroundColor Green

Write-Host "`n=== TEST 11: Client Marks Job Complete ===" -ForegroundColor Cyan
$compRes = Call-Api -Path "/api/jobs/$jobId/complete" -Method "POST" -Token $clientToken
Write-Host "Complete response: $($compRes.message)" -ForegroundColor Green

Write-Host "`n=== TEST 12: Admin Views All Users (/api/admin/users) ===" -ForegroundColor Cyan
$allUsers = Call-Api -Path "/api/admin/users" -Token $adminToken
Write-Host "Total users in system: $($allUsers.Count)" -ForegroundColor Green

Write-Host "`n=== TEST 13: Admin Deletes User (/api/admin/users/:id) ===" -ForegroundColor Cyan
$delRes = Call-Api -Path "/api/admin/users/$freelancerId" -Method "DELETE" -Token $adminToken
Write-Host "Delete response: $($delRes.message)" -ForegroundColor Green

Write-Host "`n=== ALL API TESTS PASSED SUCCESSFULLY! ===" -ForegroundColor Green
