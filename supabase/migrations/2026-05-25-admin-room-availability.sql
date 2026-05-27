ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS assigned_room_unit_id UUID;

CREATE TABLE IF NOT EXISTS room_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'inactive', 'maintenance')
  ),
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_unit_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_unit_id UUID NOT NULL REFERENCES room_units(id) ON DELETE CASCADE,
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'direct' CHECK (
    source IN ('direct', 'external')
  ),
  status TEXT NOT NULL DEFAULT 'tentative' CHECK (
    status IN ('tentative', 'confirmed', 'cancelled')
  ),
  guest_name TEXT NOT NULL DEFAULT '',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_unit_blocks_valid_dates CHECK (check_out_date > check_in_date)
);

ALTER TABLE booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_assigned_room_unit_id_fkey;

ALTER TABLE booking_requests
  ADD CONSTRAINT booking_requests_assigned_room_unit_id_fkey
  FOREIGN KEY (assigned_room_unit_id)
  REFERENCES room_units(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_booking_requests_assigned_room_unit_id
  ON booking_requests(assigned_room_unit_id);

CREATE INDEX IF NOT EXISTS idx_room_units_room_id
  ON room_units(room_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_room_units_status
  ON room_units(status);

CREATE INDEX IF NOT EXISTS idx_room_unit_blocks_room_unit_dates
  ON room_unit_blocks(room_unit_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_room_unit_blocks_booking_request_id
  ON room_unit_blocks(booking_request_id);

CREATE INDEX IF NOT EXISTS idx_room_unit_blocks_status
  ON room_unit_blocks(status);

DROP TRIGGER IF EXISTS room_units_updated_at ON room_units;
CREATE TRIGGER room_units_updated_at
  BEFORE UPDATE ON room_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS room_unit_blocks_updated_at ON room_unit_blocks;
CREATE TRIGGER room_unit_blocks_updated_at
  BEFORE UPDATE ON room_unit_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
