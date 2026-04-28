-- Adds bedding_prepaid flag for guests who choose to pay the $15 bedding fee
-- via PayPal instead of ₩20,000 cash on arrival.
-- Run once against the live Supabase DB.

ALTER TABLE booking_requests
  ADD COLUMN bedding_prepaid BOOLEAN NOT NULL DEFAULT false;
