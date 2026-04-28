# Add all positions to fresh election
$login = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -Body '{"email":"admin@university.edu","password":"Admin@123"}' -ContentType "application/json"
$token = $login.access_token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
Write-Host "Token obtained"

$ElectionId = "acuej65wcu5kzk5p260lu6xm"

# Get academic structure via API
$schools = Invoke-RestMethod -Uri "http://localhost:8000/admin/schools" -Headers $headers
$depts = Invoke-RestMethod -Uri "http://localhost:8000/admin/departments" -Headers $headers
$courses = Invoke-RestMethod -Uri "http://localhost:8000/admin/courses" -Headers $headers

Write-Host "Found $($schools.Count) schools, $($depts.Count) departments, $($courses.Count) courses"

# Add school positions
foreach ($school in $schools) {
    $body = @{election_id=$ElectionId; name="$($school.name) Representative"; level="SCHOOL"; school_id=$school.id} | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri "http://localhost:8000/admin/positions" -Method POST -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "Added school position: $($school.name) Representative"
}

# Add department positions
foreach ($dept in $depts) {
    $body = @{election_id=$ElectionId; name="$($dept.name) Representative"; level="DEPARTMENT"; school_id=$dept.school_id; department_id=$dept.id} | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri "http://localhost:8000/admin/positions" -Method POST -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "Added department position: $($dept.name) Representative"
}

# Add class positions
foreach ($course in $courses) {
    # Get nested properties
    $schoolId = $course.department.school_id
    $deptId = $course.department.id
    $body = @{election_id=$ElectionId; name="$($course.name) Class Rep"; level="CLASS"; school_id=$schoolId; department_id=$deptId; course_id=$course.id} | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri "http://localhost:8000/admin/courses" -Method POST -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "Added class position: $($course.name) Class Rep"
}

Write-Host "`n[OK] All positions added to election $ElectionId"
Write-Host "Next: Add candidates via admin panel or API"
