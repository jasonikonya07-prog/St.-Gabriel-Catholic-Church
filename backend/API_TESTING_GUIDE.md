# St. Gabriel Church Backend Testing Guide

Use this guide in Postman or Thunder Client.

Base URL:

```txt
http://localhost:5000
```

Recommended environment variables:

```txt
baseUrl=http://localhost:5000
adminToken=
contactId=
prayerId=
subscriberId=
announcementId=
announcementSlug=
eventId=
eventSlug=
donationId=
transactionCode=
checkoutRequestId=
```

Common JSON header:

```json
{
  "Content-Type": "application/json"
}
```

Admin JWT header:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {{adminToken}}"
}
```

After login, copy the returned `token` into `adminToken`.

## Health Check

### API Health

Method: `GET`

URL:

```txt
{{baseUrl}}/api/health
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "service": "St. Gabriel Church API",
  "status": "ok",
  "timestamp": "2026-05-23T..."
}
```

## Auth

### Admin Login

Method: `POST`

URL:

```txt
{{baseUrl}}/api/auth/login
```

Headers:

```json
{
  "Content-Type": "application/json"
}
```

Body:

```json
{
  "email": "admin@stgabriel.local",
  "password": "your_admin_password"
}
```

Requires admin JWT: No

Expected response:

```json
{
  "admin": {
    "id": "admin-uuid",
    "name": "Church Admin",
    "email": "admin@stgabriel.local",
    "role": "Super Admin",
    "isActive": true,
    "lastLogin": "2026-05-23T..."
  },
  "token": "jwt-token"
}
```

### Get Current Admin

Method: `GET`

URL:

```txt
{{baseUrl}}/api/auth/me
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "admin": {
    "id": "admin-uuid",
    "name": "Church Admin",
    "email": "admin@stgabriel.local",
    "role": "Super Admin",
    "isActive": true
  }
}
```

## Contact Messages

### Submit Contact Message

Method: `POST`

URL:

```txt
{{baseUrl}}/api/contact
```

Headers: Common JSON header

Body:

```json
{
  "fullName": "Mary Wanjiku",
  "email": "mary@example.com",
  "phone": "0712345678",
  "subject": "Parish office inquiry",
  "message": "Hello, I would like to ask about parish office hours this week."
}
```

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "message": "Contact message submitted successfully.",
  "contactMessage": {
    "id": "contact-uuid",
    "fullName": "Mary Wanjiku",
    "email": "mary@example.com",
    "status": "unread"
  }
}
```

Save `contactMessage.id` as `contactId`.

### List Contact Messages

Method: `GET`

URL:

```txt
{{baseUrl}}/api/contact?page=1&limit=10&status=unread&search=mary
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "messages": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Get Contact Message

Method: `GET`

URL:

```txt
{{baseUrl}}/api/contact/{{contactId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "contactMessage": {
    "id": "contact-uuid",
    "fullName": "Mary Wanjiku",
    "status": "unread"
  }
}
```

### Update Contact Message Status

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/contact/{{contactId}}/status
```

Headers: Admin JWT header

Body:

```json
{
  "status": "read",
  "adminNotes": "Reviewed by parish office."
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Contact message updated successfully.",
  "contactMessage": {
    "id": "contact-uuid",
    "status": "read"
  }
}
```

### Delete Contact Message

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/contact/{{contactId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Contact message deleted successfully.",
  "data": {
    "id": "contact-uuid"
  }
}
```

## Prayer Requests

### Submit Prayer Request

Method: `POST`

URL:

```txt
{{baseUrl}}/api/prayers
```

Headers: Common JSON header

Body:

```json
{
  "fullName": "John Kamau",
  "contact": "0712345678",
  "category": "Healing",
  "message": "Please pray for healing and strength for my family member.",
  "isPrivate": true
}
```

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "message": "Prayer request submitted successfully.",
  "prayer": {
    "id": "prayer-uuid",
    "category": "Healing",
    "status": "pending",
    "privateBadge": "Private"
  }
}
```

Save `prayer.id` as `prayerId`.

### List Prayer Requests

Method: `GET`

URL:

```txt
{{baseUrl}}/api/prayers?page=1&limit=10&status=pending&category=Healing&isPrivate=true
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "prayers": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Get Prayer Request

Method: `GET`

URL:

```txt
{{baseUrl}}/api/prayers/{{prayerId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "prayer": {
    "id": "prayer-uuid",
    "status": "pending"
  }
}
```

### Update Prayer Request Status

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/prayers/{{prayerId}}/status
```

Headers: Admin JWT header

Body:

```json
{
  "status": "prayed",
  "adminNotes": "Included in parish prayer team intentions."
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Prayer request updated successfully.",
  "prayer": {
    "id": "prayer-uuid",
    "status": "prayed"
  }
}
```

### Delete Prayer Request

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/prayers/{{prayerId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "deleted": true,
  "message": "Prayer request deleted successfully."
}
```

## Newsletter

### Subscribe

Method: `POST`

URL:

```txt
{{baseUrl}}/api/newsletter/subscribe
```

Headers: Common JSON header

Body:

```json
{
  "email": "parishioner@example.com",
  "fullName": "Agnes Njeri",
  "source": "website"
}
```

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "message": "Newsletter subscription created.",
  "subscriber": {
    "id": "subscriber-uuid",
    "email": "parishioner@example.com",
    "status": "subscribed"
  }
}
```

Save `subscriber.id` as `subscriberId`.

### Unsubscribe

Method: `POST`

URL:

```txt
{{baseUrl}}/api/newsletter/unsubscribe
```

Headers: Common JSON header

Body:

```json
{
  "email": "parishioner@example.com"
}
```

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "message": "Newsletter subscription cancelled successfully.",
  "subscriber": {
    "email": "parishioner@example.com",
    "status": "unsubscribed"
  }
}
```

### List Subscribers

Method: `GET`

URL:

```txt
{{baseUrl}}/api/newsletter/subscribers?page=1&limit=10&status=subscribed&search=agnes
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "subscribers": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Delete Subscriber

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/newsletter/subscribers/{{subscriberId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "deleted": true,
  "message": "Newsletter subscriber deleted successfully."
}
```

## Announcements

### List Published Announcements

Method: `GET`

URL:

```txt
{{baseUrl}}/api/announcements?page=1&limit=10&category=Parish%20News&search=mass
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "announcements": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Get Published Announcement By Slug

Method: `GET`

URL:

```txt
{{baseUrl}}/api/announcements/{{announcementSlug}}
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "announcement": {
    "id": 1,
    "title": "Special Mass this Sunday",
    "slug": "special-mass-this-sunday",
    "isPublished": true
  }
}
```

### List All Announcements

Method: `GET`

URL:

```txt
{{baseUrl}}/api/announcements/admin/all?page=1&limit=10
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "announcements": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Create Announcement

Method: `POST`

URL:

```txt
{{baseUrl}}/api/announcements
```

Headers: Admin JWT header

Body:

```json
{
  "title": "Special Mass this Sunday",
  "category": "Mass Update",
  "summary": "There will be a special family Mass this Sunday morning.",
  "content": "All parishioners are invited to attend the special family Mass this Sunday at 9:00 AM.",
  "imageUrl": "https://example.com/church.jpg",
  "isPublished": true
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Announcement created successfully.",
  "announcement": {
    "id": 1,
    "title": "Special Mass this Sunday",
    "slug": "special-mass-this-sunday"
  }
}
```

Save `announcement.id` as `announcementId` and `announcement.slug` as `announcementSlug`.

### Update Announcement

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/announcements/{{announcementId}}
```

Headers: Admin JWT header

Body:

```json
{
  "summary": "Updated announcement summary for parishioners.",
  "isPublished": true
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Announcement updated successfully.",
  "announcement": {
    "id": 1,
    "summary": "Updated announcement summary for parishioners."
  }
}
```

### Publish Or Unpublish Announcement

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/announcements/{{announcementId}}/publish
```

Headers: Admin JWT header

Body:

```json
{
  "isPublished": false
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Announcement unpublished successfully.",
  "announcement": {
    "id": 1,
    "isPublished": false
  }
}
```

### Delete Announcement

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/announcements/{{announcementId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "deleted": true,
  "message": "Announcement deleted successfully."
}
```

## Events

### List Published Upcoming Events

Method: `GET`

URL:

```txt
{{baseUrl}}/api/events?page=1&limit=10&category=Parish&search=family
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "events": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Get Published Event By Slug

Method: `GET`

URL:

```txt
{{baseUrl}}/api/events/{{eventSlug}}
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "event": {
    "id": 1,
    "title": "Sunday Family Mass",
    "slug": "sunday-family-mass",
    "isPublished": true
  }
}
```

### List All Events

Method: `GET`

URL:

```txt
{{baseUrl}}/api/events/admin/all?page=1&limit=10
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "events": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Create Event

Method: `POST`

URL:

```txt
{{baseUrl}}/api/events
```

Headers: Admin JWT header

Body:

```json
{
  "title": "Sunday Family Mass",
  "description": "A family-centered Sunday Mass for the parish community.",
  "eventDate": "2026-06-07",
  "startTime": "09:00",
  "endTime": "10:30",
  "location": "Main Church",
  "category": "Mass",
  "imageUrl": "https://example.com/mass.jpg",
  "isFeatured": true,
  "isPublished": true
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Event created successfully.",
  "event": {
    "id": 1,
    "title": "Sunday Family Mass",
    "slug": "sunday-family-mass"
  }
}
```

Save `event.id` as `eventId` and `event.slug` as `eventSlug`.

### Update Event

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/events/{{eventId}}
```

Headers: Admin JWT header

Body:

```json
{
  "location": "Parish Main Church",
  "isFeatured": false
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Event updated successfully.",
  "event": {
    "id": 1,
    "location": "Parish Main Church"
  }
}
```

### Publish Or Unpublish Event

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/events/{{eventId}}/publish
```

Headers: Admin JWT header

Body:

```json
{
  "isPublished": false
}
```

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "message": "Event unpublished successfully.",
  "event": {
    "id": 1,
    "isPublished": false
  }
}
```

### Delete Event

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/events/{{eventId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "deleted": true,
  "message": "Event deleted successfully."
}
```

## Donations

### Create Donation Record

Method: `POST`

URL:

```txt
{{baseUrl}}/api/donations
```

Headers: Common JSON header

Body:

```json
{
  "donorName": "Peter Otieno",
  "phone": "0712345678",
  "email": "peter@example.com",
  "amount": 500,
  "purpose": "Tithe",
  "paymentMethod": "M-Pesa",
  "message": "Monthly tithe"
}
```

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "message": "Donation record created successfully.",
  "donation": {
    "id": 1,
    "donorName": "Peter Otieno",
    "amount": "500.00",
    "status": "pending",
    "transactionCode": "SGC-..."
  }
}
```

Save `donation.id` as `donationId` and `donation.transactionCode` as `transactionCode`.

### Send M-Pesa STK Push

Method: `POST`

URL:

```txt
{{baseUrl}}/api/donations/mpesa/stk-push
```

Headers: Common JSON header

Body:

```json
{
  "donorName": "Peter Otieno",
  "phone": "0712345678",
  "email": "peter@example.com",
  "amount": 50,
  "purpose": "Tithe",
  "message": "Sunday offering"
}
```

Requires admin JWT: No

Expected success response:

```json
{
  "success": true,
  "message": "M-Pesa prompt sent. Please check your phone and enter your PIN.",
  "data": {
    "checkoutRequestId": "ws_CO_...",
    "customerMessage": "Success. Request accepted for processing",
    "transactionCode": "SGC-MPESA-..."
  }
}
```

Note: This requires valid Safaricom Daraja sandbox credentials in `backend/.env`.

### M-Pesa Callback

Method: `POST`

URL:

```txt
{{baseUrl}}/api/donations/mpesa/callback
```

Headers: Common JSON header

Body:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "{{checkoutRequestId}}",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 50 },
          { "Name": "MpesaReceiptNumber", "Value": "QK123ABC45" },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

Requires admin JWT: No

Expected response:

```json
{
  "ResultCode": 0,
  "ResultDesc": "Callback processed successfully.",
  "success": true,
  "data": {
    "donationId": 1,
    "status": "completed",
    "transactionCode": "SGC-MPESA-..."
  }
}
```

### Verify Donation By Transaction Code

Method: `GET`

URL:

```txt
{{baseUrl}}/api/donations/verify/{{transactionCode}}
```

Headers: none

Body: none

Requires admin JWT: No

Expected response:

```json
{
  "success": true,
  "donation": {
    "id": 1,
    "transactionCode": "SGC-...",
    "status": "pending"
  }
}
```

### List Donations

Method: `GET`

URL:

```txt
{{baseUrl}}/api/donations?page=1&limit=10&status=pending&purpose=Tithe&paymentMethod=M-Pesa&search=peter
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes. Role must be `Super Admin`, `admin`, or `finance`.

Expected response:

```json
{
  "success": true,
  "donations": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 1,
    "total": 0
  }
}
```

### Donation Stats

Method: `GET`

URL:

```txt
{{baseUrl}}/api/donations/stats
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes. Role must be `Super Admin`, `admin`, or `finance`.

Expected response:

```json
{
  "success": true,
  "stats": {
    "totalAmount": 0,
    "completedAmount": 0,
    "pendingAmount": 0,
    "totalCount": 0,
    "completedCount": 0,
    "pendingCount": 0,
    "byPurpose": []
  }
}
```

### Get Donation

Method: `GET`

URL:

```txt
{{baseUrl}}/api/donations/{{donationId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes. Role must be `Super Admin`, `admin`, or `finance`.

Expected response:

```json
{
  "success": true,
  "donation": {
    "id": 1,
    "status": "pending"
  }
}
```

### Update Donation Status

Method: `PATCH`

URL:

```txt
{{baseUrl}}/api/donations/{{donationId}}/status
```

Headers: Admin JWT header

Body:

```json
{
  "status": "completed",
  "transactionCode": "MANUAL-RECEIPT-001",
  "mpesaReceiptNumber": "QK123ABC45"
}
```

Requires admin JWT: Yes. Role must be `Super Admin`, `admin`, or `finance`.

Expected response:

```json
{
  "success": true,
  "message": "Donation status updated successfully.",
  "donation": {
    "id": 1,
    "status": "completed"
  }
}
```

### Delete Donation

Method: `DELETE`

URL:

```txt
{{baseUrl}}/api/donations/{{donationId}}
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes. Role must be `Super Admin`, `admin`, or `finance`.

Expected response:

```json
{
  "success": true,
  "deleted": true,
  "message": "Donation deleted successfully."
}
```

## Dashboard

### Dashboard Stats

Method: `GET`

URL:

```txt
{{baseUrl}}/api/dashboard/stats
```

Headers: Admin JWT header

Body: none

Requires admin JWT: Yes

Expected response:

```json
{
  "success": true,
  "status": "success",
  "stats": {
    "totalDonationsAmount": 0,
    "completedDonationsAmount": 0,
    "pendingDonationsAmount": 0,
    "totalContactMessages": 0,
    "unreadContactMessages": 0,
    "totalPrayerRequests": 0,
    "pendingPrayerRequests": 0,
    "totalNewsletterSubscribers": 0,
    "publishedAnnouncementsCount": 0,
    "upcomingEventsCount": 0
  },
  "charts": {
    "monthlyDonationsTotal": []
  },
  "recent": {
    "donations": [],
    "contactMessages": [],
    "prayerRequests": []
  }
}
```

## Error Response Examples

### Missing Admin Token

Expected status: `401`

```json
{
  "success": false,
  "status": "fail",
  "message": "Admin authentication token is required."
}
```

### Validation Error

Expected status: `400`

```json
{
  "success": false,
  "status": "fail",
  "message": "Please check the highlighted fields.",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address."
    }
  ]
}
```

### Route Not Found

Expected status: `404`

```json
{
  "success": false,
  "status": "fail",
  "message": "Route not found: /api/unknown"
}
```
