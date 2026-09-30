-- Beauty Heaven Hub assistants: conversation records.
-- Run once in the Supabase SQL editor (project region: London).
-- Only the server (service key) reads or writes; row-level security is on
-- with no policies, so the public "anon" key can do nothing.

create table if not exists bot_messages (
  id          bigint generated always as identity primary key,
  channel     text not null,          -- telegram, whatsapp, voice
  chat        text not null,          -- the chat or phone id on that channel
  convo       text not null,          -- one conversation (a new one after 12 quiet hours)
  role        text not null,          -- user, assistant, system
  content     jsonb not null,         -- the message exactly as sent to / returned by Claude
  created_at  timestamptz not null default now()
);
create index if not exists bot_messages_chat on bot_messages (channel, chat, id desc);
create index if not exists bot_messages_convo on bot_messages (convo, id);
alter table bot_messages enable row level security;

-- Retention: delete conversations older than the agreed period (set with the salon), e.g. 12 months:
-- delete from bot_messages where created_at < now() - interval '12 months';

-- The Content Console's shared copy (brand, ideas, drafts, approvals, calendar).
create table if not exists console_state (
  id          text primary key,
  version     integer not null default 1,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table console_state enable row level security;
