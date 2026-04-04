# Goshiwon Website Spec for Foreigners in Korea — V1

## Summary

Build an English-first marketing and lead-conversion website for a single goshiwon property, aimed at foreigners looking for short-term or long-term stay in Korea.

The site should feel trustworthy, practical, and easy to act on, with clear room information, transparent pricing, and an Airbnb-style **Request to Book** flow that does **not** instantly confirm reservations and does **not** collect payment in v1.

The product goal is to turn site visitors into qualified booking inquiries through a structured booking request form and clear contact options. The request is stored in the system for manual review by the host. The host then follows up manually through email.

The v1 includes a lightweight admin dashboard to manage room inventory, pricing, and incoming booking requests.

---

## Key Product Requirements

### Home Page

- Hero section
- Property highlights
- Key amenities
- Neighborhood access
- Pricing summary
- Testimonials or trust signals
- Repeated `Request to Book` CTAs

### Room Browsing

- Room types
- Photos
- Size and features
- Occupancy
- Stay rules
- Included amenities

### Transparent Pricing

- Fixed public prices:
  - per night
  - per week
  - per month
- Clearly show inclusions and exclusions
- Pricing is **estimate only**, not a confirmed booking

### Foreigner-Friendly Content

- What a goshiwon is
- Check-in process
- Required documents
- House rules
- Nearby transit and locations
- FAQ

### Contact Features

- Email
- WhatsApp (inquiry only)
- KakaoTalk (inquiry only)
- Map/location section

---

## Request to Book Feature

### Overview

- Airbnb-style **request flow**
- No instant booking
- No payment in v1
- Email is the **only booking communication channel**

---

### Form Fields

- Full Name (required)
- Email (required)
- Room Type
- Check-in Date
- Check-out Date
- Guest Count
- Notes / Message

---

### Submit Flow

1. Validate inputs
2. Validate date logic
3. Recalculate estimated pricing on server
4. Store request in Supabase
5. Create admin record
6. Send admin notification email
7. Send guest confirmation email
8. Show success page

---

### Success Page

Display:

- "Request sent"
- Request summary
- Message:

> This is not a confirmed booking.  
> We will review availability and contact you via email within X hours.

---

### Guest Confirmation Email

**Subject:**
Your booking request has been received

**Content:**

- Room
- Dates
- Guest count

Message:

> This is not a confirmed booking yet.  
> We will review availability and contact you shortly.

---

## Communication Model

### Booking Communication

- Email is the primary and only booking channel
- System sends:
  - confirmation email to guest
  - notification email to admin
- Admin follows up manually via email

### External Channels

- WhatsApp and KakaoTalk:
  - Used for general inquiries only
  - Not part of booking flow

---

## Admin Dashboard

### Features

- Secure login
- Room management (CRUD)
- Booking request list
- Filters by status and date
- Request detail view
- Internal notes

---

### Booking Request Status

- `new`
- `reviewing`
- `contacted`
- `approved`
- `declined`
- `expired`
- `closed`

---

### Request Detail View

- Guest info
- Room
- Dates
- Stay length
- Estimated total
- Notes
- Status
- Admin notes

---

### Admin Actions

- Change status
- Add note
- Copy summary
- Open email (`mailto:`)
- Mark contacted / approved / declined / closed

---

## Availability Rules

- Managed manually in admin
- Requests do NOT reserve rooms automatically
- Multiple requests allowed per room
- Use soft labels:
  - Available now
  - Available soon
  - Limited availability
  - Request to confirm

---

## Data Models

### RoomType

- id
- name
- slug
- description
- priceMonthly
- priceWeekly
- priceDaily
- capacity
- amenities
- availableFrom
- status
- createdAt

---

### RoomImage

- id
- roomId
- url
- sortOrder

---

### BookingRequest

- id
- guestName
- guestEmail
- guestCount
- roomSlug
- checkInDate
- checkOutDate
- estimatedTotal
- notes
- status
- adminNotes
- createdAt

---

### AdminUser

- id
- email
- passwordHash

---

## Content & SEO

- Target keywords:
  - goshiwon in Seoul
  - cheap room in Korea
  - short term stay Korea
  - student housing Seoul

- Include:
  - metadata
  - Open Graph tags
  - structured FAQ
  - location-based headings
  - alt text for images

---

## Design Direction

- Clean and trustworthy
- Mobile-first
- Photo-focused
- Clear pricing
- High-contrast CTAs
- Practical (not luxury)

---

## Test Plan

### Public Site

- Fast loading
- Working CTAs
- Correct room info
- Contact links functional

### Booking Flow

- Form validation works
- Server recalculates pricing
- Request saved correctly
- Emails sent
- Success message clear

### Admin

- Login protected
- Room updates visible
- Status updates work
- Notes saved

### SEO

- Metadata correct
- Pages crawlable
- Accessible UI

---

## Assumptions

- Single property
- Foreigners are primary users
- English-first
- Request-only booking
- No payment in v1
- No instant confirmation
- Manual availability
- No external integrations

---

## Out of Scope (V1)

- Online payment
- Card processing
- Bank transfer automation
- Cash workflow
- Real-time inventory
- Guest accounts
- In-app chat
- WhatsApp/Kakao automation
- PMS integration
- Channel manager

---

## V2 Direction

- Payment integration
- Card authorization + capture
- Bank transfer support
- Reservation confirmation system
- Inventory management improvements
- CRM and follow-up tools
