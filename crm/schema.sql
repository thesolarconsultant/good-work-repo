-- =========================================================
-- Salon platform — database schema
--
-- Two ideas decide the shape of everything below.
--
-- 1. The domain is real tables; the differences between clients are JSONB.
--    A generic record store is the right answer to "every salon is set up
--    differently" and the wrong answer for appointments. Availability search
--    has to be indexed, and no-double-booking has to be enforced by the
--    database — neither is possible against an opaque blob. So the salon's
--    core is columns, and each workspace's *extra* fields hang off the
--    metadata tables via a jsonb column validated by crm/engine/schema.js.
--
-- 2. The JavaScript engine prevents double-booking in the interface. Only the
--    database prevents it under concurrency. Two receptionists clicking at the
--    same moment both pass the in-process check and both insert; an exclusion
--    constraint is the only thing between that and a client arriving to a
--    stylist who is already busy. Belt and braces, deliberately.
--
-- Postgres 14+.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- a uuid = beside a range && in one constraint
CREATE EXTENSION IF NOT EXISTS citext;     -- email equality without lower() everywhere

-- ---------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------

CREATE TABLE workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]{1,60}$'),
  name        text NOT NULL,
  timezone    text NOT NULL DEFAULT 'Europe/London',
  currency    char(3) NOT NULL DEFAULT 'GBP',
  -- Listed or not; a nullable timestamp says that more plainly than a flag,
  -- and records when it happened.
  listed_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE TABLE users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       citext NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('owner', 'manager', 'stylist', 'front_desk')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ---------------------------------------------------------
-- Per-workspace custom fields
--
-- The salon's own additions to a client record: a nail bar wants gel removal
-- history, a clinic wants a GP's name. Definitions here, values in the
-- `custom` jsonb on the record itself, both validated by engine/schema.js
-- before they ever reach the database.
-- ---------------------------------------------------------

CREATE TABLE field_defs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  applies_to   text NOT NULL CHECK (applies_to IN ('client', 'appointment', 'service', 'staff')),
  slug         text NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]{0,38}[a-z0-9]$'),
  label        text NOT NULL,
  type         text NOT NULL,
  required     boolean NOT NULL DEFAULT false,
  options      jsonb,
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, applies_to, slug)
);

-- ---------------------------------------------------------
-- The salon
-- ---------------------------------------------------------

CREATE TABLE rooms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  -- The salon floor is not a room. It is an area with stations, and treating
  -- it as a room-of-one is what makes a calendar refuse every booking after
  -- the first.
  capacity     integer NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rooms_workspace_idx ON rooms (workspace_id);

CREATE TABLE staff (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  name         text NOT NULL,
  role         text,
  colour       text,
  custom       jsonb NOT NULL DEFAULT '{}'::jsonb,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staff_workspace_idx ON staff (workspace_id) WHERE active;

-- The marketplace's own vocabulary, shared by every workspace. A salon calls
-- it "Luxe Hydrafacial 60"; a consumer searches for "facial". The salon owns
-- its words, we own the search axis.
CREATE TABLE marketplace_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES marketplace_categories(id) ON DELETE CASCADE,
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL
);

CREATE TABLE services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  duration      integer NOT NULL CHECK (duration > 0),
  -- The developing window: the client and the chair are held, the stylist is
  -- free. Both columns or neither.
  processing_after    integer CHECK (processing_after >= 0),
  processing_minutes  integer CHECK (processing_minutes > 0),
  cleanup       integer NOT NULL DEFAULT 0 CHECK (cleanup >= 0),
  room_id       uuid REFERENCES rooms(id) ON DELETE SET NULL,
  price         numeric(10, 2),
  colour        text,
  category_id   uuid REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  custom        jsonb NOT NULL DEFAULT '{}'::jsonb,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processing_is_both_or_neither
    CHECK ((processing_after IS NULL) = (processing_minutes IS NULL)),
  CONSTRAINT processing_fits_inside_the_service
    CHECK (processing_after IS NULL OR processing_after + processing_minutes <= duration)
);
CREATE INDEX services_workspace_idx ON services (workspace_id) WHERE active;
CREATE INDEX services_category_idx ON services (category_id) WHERE category_id IS NOT NULL;

CREATE TABLE clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        citext,
  phone        text,
  -- Front-of-house note. NOT the place for anything medical — that is
  -- treatment_notes, which is access-logged.
  note         text,
  custom       jsonb NOT NULL DEFAULT '{}'::jsonb,
  marketing_consent_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX clients_workspace_idx ON clients (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX clients_email_idx ON clients (workspace_id, email) WHERE email IS NOT NULL;

CREATE TABLE shifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  during       tstzrange NOT NULL,
  CONSTRAINT shift_is_a_real_span CHECK (NOT isempty(during)),
  -- One person cannot be on two shifts at once.
  EXCLUDE USING gist (staff_id WITH =, during WITH &&)
);
CREATE INDEX shifts_lookup_idx ON shifts USING gist (workspace_id, during);

-- ---------------------------------------------------------
-- Appointments
--
-- The appointment is what the salon talks about. The *segments* are what the
-- database enforces, because a service does not occupy its people and its
-- rooms uniformly: during the developing window the chair is held and the
-- stylist is not, and during turnaround the room is held and nobody is in it.
-- Constraining the whole span would refuse bookings that are perfectly legal.
-- ---------------------------------------------------------

CREATE TABLE appointments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES clients(id) ON DELETE SET NULL,
  staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  service_id   uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  room_id      uuid REFERENCES rooms(id) ON DELETE SET NULL,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'booked'
                 CHECK (status IN ('booked', 'arrived', 'completed', 'cancelled', 'no_show')),
  source       text NOT NULL DEFAULT 'salon'
                 CHECK (source IN ('salon', 'online', 'marketplace', 'agent')),
  deposit      numeric(10, 2),
  custom       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT appointment_ends_after_it_starts CHECK (ends_at > starts_at)
);
CREATE INDEX appointments_day_idx ON appointments (workspace_id, starts_at)
  WHERE status <> 'cancelled';
CREATE INDEX appointments_client_idx ON appointments (client_id, starts_at DESC);

CREATE TABLE appointment_segments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  during         tstzrange NOT NULL,
  -- Denormalised from the appointment so the exclusion constraints can see
  -- them. Kept honest by the trigger below rather than by hope.
  staff_id       uuid REFERENCES staff(id) ON DELETE CASCADE,
  room_id        uuid REFERENCES rooms(id) ON DELETE CASCADE,
  holds_staff    boolean NOT NULL,
  holds_room     boolean NOT NULL,
  active         boolean NOT NULL DEFAULT true,
  -- Whether this segment's room holds exactly one client. An exclusion
  -- constraint's predicate cannot run a subquery, so the room's capacity
  -- cannot be looked up at check time — it has to be on the row. Set by the
  -- trigger below, never by the caller, so it cannot drift from the room.
  room_exclusive boolean NOT NULL DEFAULT true,

  CONSTRAINT segment_is_a_real_span CHECK (NOT isempty(during)),

  -- The constraint the whole product rests on: one stylist cannot be held by
  -- two overlapping segments. A cancelled appointment sets active = false and
  -- drops out of the index.
  CONSTRAINT no_double_booked_staff
    EXCLUDE USING gist (staff_id WITH =, during WITH &&)
    WHERE (holds_staff AND active),

  -- Exclusive rooms only. A shared floor has capacity > 1, which an exclusion
  -- constraint cannot express — that is checked by the trigger below.
  CONSTRAINT no_double_booked_exclusive_room
    EXCLUDE USING gist (room_id WITH =, during WITH &&)
    WHERE (holds_room AND active AND room_exclusive AND room_id IS NOT NULL)
);
CREATE INDEX segments_appointment_idx ON appointment_segments (appointment_id);
CREATE INDEX segments_window_idx ON appointment_segments USING gist (workspace_id, during)
  WHERE active;

-- ---------------------------------------------------------
-- Health data — special category under UK GDPR Article 9
--
-- Treatment notes, contraindications and before/after photographs are not
-- ordinary CRM fields. They need a lawful basis, a retention limit, and a
-- record of who looked. Designed in now; unretrofittable later, once real
-- clinics have real clients' notes in here.
-- ---------------------------------------------------------

CREATE TABLE treatment_notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  author_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  -- Encrypted before it arrives; the database never sees the plaintext and
  -- neither does anyone reading a backup.
  body_encrypted bytea NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  -- Retention is a column, not a policy document nobody runs.
  erase_after    timestamptz
);
CREATE INDEX treatment_notes_client_idx ON treatment_notes (client_id, created_at DESC);
CREATE INDEX treatment_notes_erase_idx ON treatment_notes (erase_after)
  WHERE erase_after IS NOT NULL;

CREATE TABLE consent_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind         text NOT NULL,
  granted_at   timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  evidence     jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX consent_client_idx ON consent_records (client_id, kind);

-- Who opened a health record, and when. Append-only by convention and by the
-- absence of any code path that updates it.
CREATE TABLE record_access_log (
  id           bigserial PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  client_id    uuid NOT NULL,
  action       text NOT NULL CHECK (action IN ('view', 'create', 'update', 'export', 'delete')),
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_log_client_idx ON record_access_log (client_id, at DESC);

-- ---------------------------------------------------------
-- Marketplace availability index
--
-- "Botox in Cardiff, Saturday afternoon" must answer in under a second.
-- Computing that live across every listed salon is O(salons) per search and
-- collapses at a few hundred listings, so search reads this derived table
-- instead. It is a cache: allowed to be briefly stale, which is why the
-- confirm step re-checks the real calendar before it commits.
-- ---------------------------------------------------------

CREATE TABLE availability_slots (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id  uuid NOT NULL REFERENCES marketplace_categories(id) ON DELETE CASCADE,
  staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id   uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  price        numeric(10, 2),
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, staff_id, service_id, starts_at)
);
CREATE INDEX availability_search_idx ON availability_slots (category_id, starts_at);

-- ---------------------------------------------------------
-- Shared rooms
--
-- An exclusion constraint says "at most one". A salon floor says "at most
-- six". Postgres cannot express that declaratively, so this trigger counts
-- overlapping segments against the room's capacity. It runs after the
-- exclusion constraints, so exclusive rooms are already handled.
-- ---------------------------------------------------------

-- Copy the room's exclusivity onto the segment before it is checked, so the
-- constraint above has something it is allowed to read.
CREATE FUNCTION set_room_exclusivity() RETURNS trigger AS $$
BEGIN
  NEW.room_exclusive := COALESCE(
    (SELECT capacity = 1 FROM rooms WHERE id = NEW.room_id), true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER segments_know_their_room
  BEFORE INSERT OR UPDATE ON appointment_segments
  FOR EACH ROW EXECUTE FUNCTION set_room_exclusivity();

CREATE FUNCTION enforce_room_capacity() RETURNS trigger AS $$
DECLARE
  room_capacity integer;
  taken integer;
BEGIN
  IF NEW.room_id IS NULL OR NOT NEW.holds_room OR NOT NEW.active THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO room_capacity FROM rooms WHERE id = NEW.room_id;
  IF room_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO taken
  FROM appointment_segments s
  WHERE s.room_id = NEW.room_id
    AND s.active
    AND s.holds_room
    AND s.id <> NEW.id
    AND s.during && NEW.during;

  IF taken >= room_capacity THEN
    RAISE EXCEPTION 'room % is full at that time (holds %)', NEW.room_id, room_capacity
      USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER segments_respect_room_capacity
  AFTER INSERT OR UPDATE ON appointment_segments
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION enforce_room_capacity();

-- ---------------------------------------------------------
-- Row-level security
--
-- Tenancy enforced by the database, not by remembering a WHERE clause. The
-- API sets `app.workspace_id` per request; a query that forgets returns
-- nothing rather than everything.
-- ---------------------------------------------------------

CREATE FUNCTION current_workspace() RETURNS uuid AS $$
  SELECT nullif(current_setting('app.workspace_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'field_defs', 'rooms', 'staff', 'services', 'clients', 'shifts',
    'appointments', 'appointment_segments', 'treatment_notes',
    'consent_records', 'record_access_log', 'availability_slots'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (workspace_id = current_workspace())', t);
  END LOOP;
END $$;
