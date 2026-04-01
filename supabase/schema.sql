create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  name text not null,
  email text not null,
  room_slug text not null,
  room_name text not null,
  check_in date not null,
  check_out date not null,
  nights integer not null,
  guests integer not null,
  pricing_basis text not null,
  estimated_total integer not null,
  message text not null default ''
);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);
