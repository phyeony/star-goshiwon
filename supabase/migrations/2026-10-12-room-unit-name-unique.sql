-- Room numbers name physical rooms, so two units can't share one — across all
-- room types, inactive units included. Case-insensitive to match the API check
-- (isRoomUnitNameTaken in lib/queries.ts).
--
-- Fails if duplicates already exist; find them first with:
--   SELECT lower(name), count(*) FROM room_units GROUP BY 1 HAVING count(*) > 1;
CREATE UNIQUE INDEX room_units_name_unique ON room_units (lower(name));
