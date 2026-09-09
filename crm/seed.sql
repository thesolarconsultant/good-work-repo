-- Minimal fixtures for schema.test.sql: two workspaces (so tenant isolation
-- has something to isolate), three rooms whose capacities are the interesting
-- cases, and three stylists.
INSERT INTO workspaces (id, slug, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'beauty-heaven', 'Beauty Heaven Hub'),
  ('22222222-2222-2222-2222-222222222222', 'other-salon', 'Someone Else')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (id, workspace_id, name, capacity) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Salon floor', 6),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Treatment room 1', 1),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Double room', 2)
ON CONFLICT DO NOTHING;

INSERT INTO staff (id, workspace_id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Sam'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Priya'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Mel')
ON CONFLICT DO NOTHING;
