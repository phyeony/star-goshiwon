# Seoul Stay Goshiwon

English-first marketing and booking request site for a single goshiwon property in Seoul, aimed at foreigners.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL)
- **Zod** (validation)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 3. Seed the database

```bash
npm run seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx                    # Homepage
  rooms/page.tsx              # Room listing
  rooms/[slug]/page.tsx       # Room detail
  request-to-book/page.tsx    # Booking request form
  request-to-book/success/    # Success page
  faq/page.tsx                # FAQ
  location/page.tsx           # Location & map
  contact/page.tsx            # Contact info
  blog/page.tsx               # Blog
  policies/page.tsx           # Policies
  admin/
    page.tsx                  # Admin dashboard
    rooms/page.tsx            # Room management
    rooms/new/page.tsx        # Add room
    rooms/[id]/edit/page.tsx  # Edit room
    requests/page.tsx         # Booking request list
    requests/[id]/page.tsx    # Request detail
  api/
    booking-requests/         # Public booking API
    admin/rooms/              # Admin room CRUD API
    admin/requests/           # Admin request update API
components/
  header.tsx                  # Site header with nav
  footer.tsx                  # Site footer
  room-card.tsx               # Room preview card
  section-title.tsx           # Section heading
  status-badge.tsx            # Status badges
  request-form.tsx            # Booking request form
  admin/
    room-form.tsx             # Room CRUD form
    request-actions.tsx       # Request status/notes panel
lib/
  supabase.ts                 # Supabase client
  types.ts                    # TypeScript types
  queries.ts                  # Database queries
  validation.ts               # Zod schemas
  pricing.ts                  # Price calculation
  site-data.ts                # Site content & config
  email.ts                    # Email scaffolding
scripts/
  seed.ts                     # Database seed script
supabase/
  schema.sql                  # Database schema
```

## Booking Flow

1. Guest fills out the request form (room, dates, contact info)
2. Client-side validation + estimated price preview
3. Server recalculates price and stores request in Supabase
4. Confirmation email sent to guest, notification to admin
5. Success page shown with "not confirmed" disclaimer
6. Admin reviews in dashboard and follows up via email

## Admin

Access the admin dashboard at `/admin`. Features:
- Room CRUD (create, edit, delete)
- Booking request list with status filters
- Request detail with status updates and admin notes
- Email guest via mailto link
- Copy request summary to clipboard

## Email

Email integration is scaffolded in `lib/email.ts`. When no SMTP is configured, emails are logged to console. To enable real emails, set the SMTP environment variables or integrate a service like Resend or SendGrid.
