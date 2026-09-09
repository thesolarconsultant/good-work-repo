-- =========================================================
-- What the database itself refuses.
--
-- The JavaScript engine stops a double-booking in the interface. Only these
-- constraints stop it under concurrency, when two receptionists click at the
-- same moment and both pass the in-process check. Run this after any change
-- to schema.sql.
--
--   createdb salon && psql -d salon -f crm/schema.sql
--   psql -d salon -f crm/seed.sql        -- workspaces, rooms, staff
--   psql -d salon -f crm/schema.test.sql
--
-- Expected: REFUSED on 1(second), 5(second), 6(third); ACCEPTED on the rest.
-- =========================================================
\set QUIET on
TRUNCATE appointment_segments, appointments CASCADE;
INSERT INTO services (id, workspace_id, name, duration) VALUES
 ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Cut',45)
 ON CONFLICT DO NOTHING;

-- One helper so each test reads as the thing it is testing, not as plumbing.
CREATE OR REPLACE FUNCTION seg(staff uuid, room uuid, lo text, hi text,
                               holds_staff boolean DEFAULT true, holds_room boolean DEFAULT true)
RETURNS text AS $$
DECLARE a uuid;
BEGIN
  INSERT INTO appointments (workspace_id, staff_id, service_id, room_id, starts_at, ends_at)
  VALUES ('11111111-1111-1111-1111-111111111111',
          COALESCE(staff,'bbbbbbbb-0000-0000-0000-000000000001'),
          'cccccccc-0000-0000-0000-000000000001', room, lo::timestamptz, hi::timestamptz)
  RETURNING id INTO a;
  INSERT INTO appointment_segments (appointment_id, workspace_id, during, staff_id, room_id, holds_staff, holds_room)
  VALUES (a, '11111111-1111-1111-1111-111111111111', tstzrange(lo::timestamptz, hi::timestamptz),
          staff, room, holds_staff, holds_room);
  RETURN 'ACCEPTED';
EXCEPTION WHEN exclusion_violation THEN
  RETURN 'REFUSED  (' || SQLERRM || ')';
END;
$$ LANGUAGE plpgsql;

\set QUIET off
\pset tuples_only on
\echo '1. one stylist, 10:00-10:45 then an overlapping 10:30 --------------'
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001', NULL, '2026-09-10 10:00+01','2026-09-10 10:45+01', true, false);
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001', NULL, '2026-09-10 10:30+01','2026-09-10 11:15+01', true, false);

\echo '2. same stylist, back-to-back at 10:45 ------------------------------'
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001', NULL, '2026-09-10 10:45+01','2026-09-10 11:30+01', true, false);

\echo '3. developing window: overlaps the stylist but does not hold them ---'
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001', NULL, '2026-09-10 10:15+01','2026-09-10 10:40+01', false, false);

\echo '4. three stylists on the shared floor, capacity 6 -------------------'
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','2026-09-10 14:00+01','2026-09-10 15:00+01', false, true);
SELECT seg('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','2026-09-10 14:00+01','2026-09-10 15:00+01', false, true);
SELECT seg('bbbbbbbb-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','2026-09-10 14:00+01','2026-09-10 15:00+01', false, true);

\echo '5. treatment room holds one: second overlapping client -------------'
SELECT seg(NULL,'aaaaaaaa-0000-0000-0000-000000000002','2026-09-10 09:00+01','2026-09-10 10:00+01', false, true);
SELECT seg(NULL,'aaaaaaaa-0000-0000-0000-000000000002','2026-09-10 09:30+01','2026-09-10 10:30+01', false, true);

\echo '6. room for two: third overlapping client ---------------------------'
SELECT seg(NULL,'aaaaaaaa-0000-0000-0000-000000000003','2026-09-10 09:00+01','2026-09-10 10:00+01', false, true);
SELECT seg(NULL,'aaaaaaaa-0000-0000-0000-000000000003','2026-09-10 09:15+01','2026-09-10 10:15+01', false, true);
SELECT seg(NULL,'aaaaaaaa-0000-0000-0000-000000000003','2026-09-10 09:30+01','2026-09-10 10:30+01', false, true);

\echo '7. cancelling frees the slot ----------------------------------------'
UPDATE appointment_segments SET active = false
 WHERE staff_id='bbbbbbbb-0000-0000-0000-000000000001' AND holds_staff
   AND during && tstzrange('2026-09-10 10:00+01'::timestamptz,'2026-09-10 10:45+01'::timestamptz);
SELECT seg('bbbbbbbb-0000-0000-0000-000000000001', NULL, '2026-09-10 10:00+01','2026-09-10 10:30+01', true, false);
