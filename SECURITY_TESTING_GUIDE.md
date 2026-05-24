# St. Gabriel Church Security Testing Guide

This guide tests the local security system for the React/Vite frontend and Node/Express/MySQL backend.

## Test Setup

Assumed local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

Start with a seeded admin and default settings:

```powershell
cd backend
npm run seed:admin
npm run seed:settings
npm run dev
```

In a new PowerShell terminal:

```powershell
$base = "http://localhost:5000/api"
$client = "http://localhost:5173"
$adminEmail = "admin@stgabrielchurch.com"
$adminPassword = "ChangeThisStrongPassword"
```

Use a unique user email for every test run:

```powershell
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$userEmail = "qa-user-$stamp@example.com"
$userPassword = "StrongPass123"
```

Important lockout note: login rate limiting and account lockout both trigger around repeated failed logins. If login spam returns `429` before account lock returns `423`, temporarily raise `LOGIN_RATE_LIMIT_MAX` in `backend/.env` during lockout QA, restart the backend, then restore it.

## 1. User Auth

### Register

Route: `POST /api/user-auth/register`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "fullName": "QA Parish User",
  "email": "qa-user@example.com",
  "phone": "+254700000001",
  "password": "StrongPass123"
}
```

PowerShell:

```powershell
$registerBody = @{
  fullName = "QA Parish User"
  email = $userEmail
  phone = "+254700000001"
  password = $userPassword
} | ConvertTo-Json

$userRegister = Invoke-RestMethod -Method Post -Uri "$base/user-auth/register" -ContentType "application/json" -Body $registerBody
$userToken = $userRegister.accessToken
$userHeaders = @{ Authorization = "Bearer $userToken" }
$userRegister
```

Expected response:

- Status: `201`
- `success: true`
- `accessToken` or `token` exists
- `user.email` equals the registered email
- Password is not returned

Common errors and fixes:

- `409 An account with this email already exists.`: use a new test email.
- `400 Password must include letters and numbers.`: use a stronger password.
- `403 Account registration is temporarily disabled.`: enable registration in Security Settings or `PATCH /api/settings/auth-options`.

### Login

Route: `POST /api/user-auth/login`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "qa-user@example.com",
  "password": "StrongPass123"
}
```

PowerShell:

```powershell
$loginBody = @{
  email = $userEmail
  password = $userPassword
} | ConvertTo-Json

$userLogin = Invoke-RestMethod -Method Post -Uri "$base/user-auth/login" -ContentType "application/json" -Body $loginBody
$userToken = $userLogin.accessToken
$userHeaders = @{ Authorization = "Bearer $userToken" }
$userLogin
```

Expected response:

- Status: `200`
- `success: true`
- `message: "Logged in successfully."`
- `accessToken` exists
- User object has no password field

Common errors and fixes:

- `401 Invalid user credentials.`: check email and password.
- `403 User login is temporarily disabled.`: re-enable user login in Security Settings.
- `423`: account is locked; wait 15 minutes or reset the account in MySQL for QA.

### Get Profile

Route: `GET /api/user-auth/me`

Headers:

```http
Authorization: Bearer USER_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/user-auth/me" -Headers $userHeaders
```

Expected response:

- Status: `200`
- `success: true`
- `user.email` matches the logged-in user
- Password is not returned

Common errors and fixes:

- `401 User authentication token is required.`: missing `Authorization` header.
- `401 Invalid or expired user token.`: login again and use the new access token.

### Logout

Route: `POST /api/user-auth/logout`

Headers:

```http
Authorization: Bearer USER_ACCESS_TOKEN
```

Body: none

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "$base/user-auth/logout" -Headers $userHeaders
```

Expected response:

- Status: `200`
- `success: true`
- `message: "Logged out successfully."`

Common errors and fixes:

- `401`: the token is missing or expired. Login again if you need to test logout.

### Wrong Password

Route: `POST /api/user-auth/login`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "qa-user@example.com",
  "password": "WrongPass123"
}
```

PowerShell:

```powershell
$wrongUserBody = @{
  email = $userEmail
  password = "WrongPass123"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post -Uri "$base/user-auth/login" -ContentType "application/json" -Body $wrongUserBody
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected response:

- Status: `401`
- Clean error message
- No password, hash, or token in logs or response
- Audit log and security event are created

### User Account Lock After 5 Failed Attempts

Route: `POST /api/user-auth/login`

Headers:

```http
Content-Type: application/json
```

Body: same wrong-password body as above.

PowerShell:

```powershell
1..5 | ForEach-Object {
  try {
    Invoke-RestMethod -Method Post -Uri "$base/user-auth/login" -ContentType "application/json" -Body $wrongUserBody
  } catch {
    "Attempt $_ -> Status $($_.Exception.Response.StatusCode.value__)"
    $_.ErrorDetails.Message
  }
}
```

Expected response:

- Attempts 1-4: usually `401`
- Attempt 5: `423` account locked
- Lock duration: about 15 minutes
- Security event: `user.account_locked`

Common errors and fixes:

- `429 Too many login attempts.` appears first: increase `LOGIN_RATE_LIMIT_MAX` temporarily for lockout testing.
- Test user remains locked: wait 15 minutes or clear `failedLoginAttempts` and `lockUntil` in MySQL.

## 2. Admin Auth

### Admin Login

Route: `POST /api/admin-auth/login`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@stgabrielchurch.com",
  "password": "ChangeThisStrongPassword"
}
```

PowerShell:

```powershell
$adminLoginBody = @{
  email = $adminEmail
  password = $adminPassword
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Method Post -Uri "$base/admin-auth/login" -ContentType "application/json" -Body $adminLoginBody
$adminToken = $adminLogin.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$adminLogin
```

Expected response:

- Status: `200`
- `success: true`
- `message: "Admin logged in successfully."`
- `accessToken` exists
- `admin.role` exists
- Password is not returned

Common errors and fixes:

- `401 Invalid admin credentials.`: check seeded admin email/password.
- `423`: account locked. Wait 15 minutes or reset the admin row for QA.
- `429`: login limiter triggered; wait for the limiter window or temporarily raise `LOGIN_RATE_LIMIT_MAX`.

### Admin Wrong Password

Route: `POST /api/admin-auth/login`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@stgabrielchurch.com",
  "password": "WrongAdminPass123"
}
```

PowerShell:

```powershell
$wrongAdminBody = @{
  email = $adminEmail
  password = "WrongAdminPass123"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post -Uri "$base/admin-auth/login" -ContentType "application/json" -Body $wrongAdminBody
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected response:

- Status: `401`
- Clean error message
- Audit log: `admin.login_failed`
- Security event: `admin.login_failed`

### Admin Account Lock

Route: `POST /api/admin-auth/login`

Headers:

```http
Content-Type: application/json
```

PowerShell:

```powershell
1..5 | ForEach-Object {
  try {
    Invoke-RestMethod -Method Post -Uri "$base/admin-auth/login" -ContentType "application/json" -Body $wrongAdminBody
  } catch {
    "Attempt $_ -> Status $($_.Exception.Response.StatusCode.value__)"
    $_.ErrorDetails.Message
  }
}
```

Expected response:

- Attempts 1-4: usually `401`
- Attempt 5: `423`
- Audit log: `admin.account_locked`
- Security event: `admin.account_locked`

Common errors and fixes:

- `429` appears first: login limiter is working. Temporarily raise the limiter for lockout-specific QA.
- You locked your only admin: wait 15 minutes or reset `failedLoginAttempts = 0, lockUntil = NULL` in MySQL.

### Protected Admin Route Access

Route: `GET /api/admin-auth/me`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/admin-auth/me" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- `success: true`
- `admin.email` matches logged-in admin

Also test protected admin data:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/audit-logs?page=1&limit=5" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- `auditLogs` array
- `pagination` object

### Invalid Token

Route: `GET /api/admin-auth/me`

Headers:

```http
Authorization: Bearer invalid.token.value
```

PowerShell:

```powershell
$badHeaders = @{ Authorization = "Bearer invalid.token.value" }
try {
  Invoke-RestMethod -Method Get -Uri "$base/admin-auth/me" -Headers $badHeaders
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected response:

- Status: `401`
- Message similar to `Invalid or expired admin token.`
- No stack trace in production

### Expired Token

Route: `GET /api/admin-auth/me`

Headers:

```http
Authorization: Bearer EXPIRED_ADMIN_ACCESS_TOKEN
```

How to test:

1. Set `JWT_ACCESS_EXPIRES_IN=5s` in `backend/.env`.
2. Restart backend.
3. Login as admin and save token.
4. Wait 6-10 seconds.
5. Call `/api/admin-auth/me`.

Expected response:

- Status: `401`
- Message similar to `Invalid or expired admin token.`

Common errors and fixes:

- Token still works: confirm backend was restarted after `.env` change.
- Frontend redirects to login: expected behavior.

## 3. Maintenance Mode

### Turn Maintenance ON

Route: `PATCH /api/settings/maintenance`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "maintenanceMode": true,
  "maintenanceTitle": "Website Under Maintenance",
  "maintenanceMessage": "We are currently improving our website. Please check back soon.",
  "maintenanceExpectedBack": "2026-05-24T08:00:00.000Z"
}
```

PowerShell:

```powershell
$maintenanceOnBody = @{
  maintenanceMode = $true
  maintenanceTitle = "Website Under Maintenance"
  maintenanceMessage = "We are currently improving our website. Please check back soon."
  maintenanceExpectedBack = "2026-05-24T08:00:00.000Z"
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "$base/settings/maintenance" -Headers $adminHeaders -ContentType "application/json" -Body $maintenanceOnBody
```

Expected response:

- Status: `200`
- `success: true`
- `settings.maintenanceMode: true`
- Audit log: `maintenance.mode_changed`
- Security event: `maintenance_mode_changed`

### Public Website Shows Maintenance Page

Route: frontend page load at `http://localhost:5173`

Expected result:

- Public website displays the maintenance page.
- Normal public pages are hidden.
- Maintenance title/message match `/api/settings/public`.

API verification:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/settings/public"
```

Expected response:

- Status: `200`
- `settings.maintenanceMode: true`

Public API block check:

```powershell
try {
  Invoke-RestMethod -Method Get -Uri "$base/announcements"
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected response:

- Status: `503`
- Maintenance message returned

### Admin Login Still Works During Maintenance

Route: `POST /api/admin-auth/login`

Headers:

```http
Content-Type: application/json
```

Body: admin login body.

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "$base/admin-auth/login" -ContentType "application/json" -Body $adminLoginBody
```

Expected response:

- Status: `200`
- Admin can login while maintenance is on.
- Admin dashboard can load protected admin APIs.

Common errors and fixes:

- `503` on admin login: maintenance middleware is mounted too early or allow-list is wrong.
- `401`: credentials or account state issue, not maintenance.

### Turn Maintenance OFF

Route: `PATCH /api/settings/maintenance`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "maintenanceMode": false,
  "maintenanceTitle": "Website Under Maintenance",
  "maintenanceMessage": "We are currently improving our website. Please check back soon.",
  "maintenanceExpectedBack": null
}
```

PowerShell:

```powershell
$maintenanceOffBody = @{
  maintenanceMode = $false
  maintenanceTitle = "Website Under Maintenance"
  maintenanceMessage = "We are currently improving our website. Please check back soon."
  maintenanceExpectedBack = $null
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "$base/settings/maintenance" -Headers $adminHeaders -ContentType "application/json" -Body $maintenanceOffBody
```

Expected response:

- Status: `200`
- `settings.maintenanceMode: false`
- Public website loads normally again.

## 4. Button Controls

### Disable Donate Now

Route: `PATCH /api/settings/buttons/donate_now`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "isEnabled": false,
  "disabledReason": "Online giving is paused for QA testing."
}
```

PowerShell:

```powershell
$disableDonateBody = @{
  isEnabled = $false
  disabledReason = "Online giving is paused for QA testing."
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "$base/settings/buttons/donate_now" -Headers $adminHeaders -ContentType "application/json" -Body $disableDonateBody
```

Expected response:

- Status: `200`
- `button.buttonKey: "donate_now"`
- `button.isEnabled: false`
- Audit log: `button.disabled`
- Security event: `button.disabled`

### Frontend Donate Button Becomes Disabled

Route: browser page at `http://localhost:5173`

Expected result:

- Donate Now button appears disabled.
- Clicking it does not navigate or submit.
- Disabled reason or temporary unavailable message appears.

API verification:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/settings/public"
```

Expected response:

- `buttonControls.donate_now.isEnabled: false`
- `disabledReason` matches the saved reason

### Backend Donation Route Is Blocked

Route: `POST /api/donations`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "donorName": "QA Donor",
  "email": "qa-donor@example.com",
  "phone": "+254700000002",
  "amount": 100,
  "purpose": "Tithe",
  "paymentMethod": "M-Pesa",
  "message": "QA disabled button test"
}
```

PowerShell:

```powershell
$donationBody = @{
  donorName = "QA Donor"
  email = "qa-donor@example.com"
  phone = "+254700000002"
  amount = 100
  purpose = "Tithe"
  paymentMethod = "M-Pesa"
  message = "QA disabled button test"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post -Uri "$base/donations" -ContentType "application/json" -Body $donationBody
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected response:

- Status: `403`
- `message: "This feature is temporarily unavailable."`
- `reason: "Online giving is paused for QA testing."`
- No donation record is created

Also test M-Pesa STK route:

Route: `POST /api/donations/mpesa/stk-push`

Expected response while disabled:

- Status: `403`
- Same message and reason

### Enable Donate Now Again

Route: `PATCH /api/settings/buttons/donate_now`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "isEnabled": true,
  "disabledReason": ""
}
```

PowerShell:

```powershell
$enableDonateBody = @{
  isEnabled = $true
  disabledReason = ""
} | ConvertTo-Json

Invoke-RestMethod -Method Patch -Uri "$base/settings/buttons/donate_now" -Headers $adminHeaders -ContentType "application/json" -Body $enableDonateBody
```

Expected response:

- Status: `200`
- `button.isEnabled: true`
- Audit log: `button.enabled`
- Donation endpoint no longer returns the button-control `403`

Common errors and fixes:

- Frontend still disabled: refresh the page or confirm `GET /api/settings/public` returns updated controls.
- Backend still blocked: verify the `button_controls` row for `donate_now` is enabled.

## 5. Rate Limiting

### Login Spam Returns 429

Route: `POST /api/admin-auth/login` or `POST /api/user-auth/login`

Headers:

```http
Content-Type: application/json
```

PowerShell:

```powershell
1..8 | ForEach-Object {
  try {
    Invoke-RestMethod -Method Post -Uri "$base/admin-auth/login" -ContentType "application/json" -Body $wrongAdminBody
  } catch {
    "Attempt $_ -> Status $($_.Exception.Response.StatusCode.value__)"
    $_.ErrorDetails.Message
  }
}
```

Expected response:

- Early attempts: `401` or `423` depending account state
- Later attempts: `429`
- Message: `Too many login attempts. Please try again later.`

Common errors and fixes:

- No `429`: confirm `LOGIN_RATE_LIMIT_MAX` is low enough and backend was restarted.
- Always `423`: account lockout triggered first; use a non-existing email to test limiter without locking a real account.

### Public Form Spam Returns 429

Route: `POST /api/contact`

Headers:

```http
Content-Type: application/json
```

Body:

```json
{
  "fullName": "QA Contact",
  "email": "qa-contact@example.com",
  "subject": "QA Rate Limit",
  "message": "This is a valid contact form message for rate limit testing."
}
```

PowerShell:

```powershell
$contactBody = @{
  fullName = "QA Contact"
  email = "qa-contact@example.com"
  subject = "QA Rate Limit"
  message = "This is a valid contact form message for rate limit testing."
} | ConvertTo-Json

1..25 | ForEach-Object {
  try {
    Invoke-RestMethod -Method Post -Uri "$base/contact" -ContentType "application/json" -Body $contactBody
  } catch {
    "Attempt $_ -> Status $($_.Exception.Response.StatusCode.value__)"
    $_.ErrorDetails.Message
  }
}
```

Expected response:

- Successful submissions until the public form limit is reached
- Then Status: `429`
- Message: `Too many form submissions. Please wait a moment and try again.`

Common errors and fixes:

- `403 This feature is temporarily unavailable.`: Contact Us button control is disabled. Enable it before rate-limit testing.
- `503`: maintenance mode is on. Turn maintenance off.

## 6. Audit Logs

### Login Logs Created

Route: `GET /api/audit-logs`

Method: `GET`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/audit-logs?search=login&page=1&limit=10" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- `auditLogs` array includes one or more:
  - `admin.login_success`
  - `admin.login_failed`
  - `user.login_success`
  - `user.login_failed`
- `pagination` exists

Common errors and fixes:

- `401`: admin token missing or expired.
- Empty list: perform login/failure tests again, then retry.

### Maintenance Logs Created

Route: `GET /api/audit-logs?module=settings&search=maintenance`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/audit-logs?module=settings&search=maintenance&page=1&limit=10" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- Audit rows include `maintenance.mode_changed` or `settings.maintenance_updated`

### Button Change Logs Created

Route: `GET /api/audit-logs?module=settings&search=button`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/audit-logs?module=settings&search=button&page=1&limit=10" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- Audit rows include `button.disabled` and/or `button.enabled`

Common errors and fixes:

- Logs missing: confirm the admin action was performed through the protected API, not direct DB edits.
- `403` on delete logs: only `super_admin` can delete logs.

## 7. Security Events

### Failed Login Events Created

Route: `GET /api/security-events`

Method: `GET`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/security-events?search=$adminEmail&page=1&limit=10" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- `securityEvents` array includes `admin.login_failed` after wrong admin password tests
- Severity is usually `medium`

User failed login search:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/security-events?search=$userEmail&page=1&limit=10" -Headers $adminHeaders
```

Expected response:

- Includes `user.login_failed`

### Locked Account Events Created

Route: `GET /api/security-events?severity=high`

Headers:

```http
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/security-events?severity=high&page=1&limit=20" -Headers $adminHeaders
```

Expected response:

- Status: `200`
- `securityEvents` array includes:
  - `admin.account_locked`
  - `user.account_locked`
- Severity: `high`

Common errors and fixes:

- No lock event: account lockout did not trigger, or rate limiter blocked before lockout. Raise login limiter temporarily and retry.
- `401`: admin token missing or expired.
- `400 Invalid severity filter.`: use one of `low`, `medium`, `high`, `critical`, or omit severity.

## Quick Cleanup After QA

Turn maintenance off:

```powershell
Invoke-RestMethod -Method Patch -Uri "$base/settings/maintenance" -Headers $adminHeaders -ContentType "application/json" -Body $maintenanceOffBody
```

Enable Donate Now:

```powershell
Invoke-RestMethod -Method Patch -Uri "$base/settings/buttons/donate_now" -Headers $adminHeaders -ContentType "application/json" -Body $enableDonateBody
```

If accounts are locked from testing, wait 15 minutes or reset the relevant rows in MySQL:

```sql
UPDATE users SET failedLoginAttempts = 0, lockUntil = NULL WHERE email LIKE 'qa-user-%@example.com';
UPDATE admins SET failedLoginAttempts = 0, lockUntil = NULL WHERE email = 'admin@stgabrielchurch.com';
```

## Security Pass Criteria

- Passwords are never returned in API responses.
- Wrong passwords create audit logs and security events.
- Accounts lock after repeated failed attempts.
- Invalid and expired tokens receive `401`.
- Admin login works during maintenance mode.
- Public APIs are blocked during maintenance except allow-listed routes.
- Disabled homepage buttons block both frontend clicks and backend POST routes.
- Rate limiters return `429` for abuse.
- Audit logs and security events are visible only with a valid admin token.
