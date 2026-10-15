-- ApplyPilot persistence.
--
-- Authentication is not implemented. There is no per-user identity yet.
-- Row level security is enabled and no policies are granted to anon or
-- authenticated, so the publishable/anon key cannot read or write these tables.
-- The Next.js server uses the secret key, which bypasses RLS. That is a
-- single-workspace development model, not a multi-user production boundary.
--
-- When auth exists, add user_id ownership and policies such as:
--   create policy "own rows" on public.applications
--   for all to authenticated
--   using (user_id = auth.uid())
--   with check (user_id = auth.uid());

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  workspace_key text not null default 'local' check (char_length(workspace_key) between 1 and 40),
  company text not null check (char_length(btrim(company)) between 1 and 160),
  role_title text not null check (char_length(btrim(role_title)) between 1 and 160),
  location text check (location is null or char_length(location) between 1 and 160),
  employment_type text check (employment_type is null or char_length(employment_type) between 1 and 80),
  status text not null default 'ready' check (
    status in (
      'analyzing',
      'ready',
      'outreach',
      'applied',
      'interview',
      'offer',
      'rejected',
      'archived'
    )
  ),
  match_score integer check (match_score is null or match_score between 0 and 100),
  match_label text check (
    match_label is null or match_label in ('Strong Match', 'Potential Match', 'Stretch')
  ),
  source_url text check (source_url is null or char_length(source_url) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  role_summary text check (role_summary is null or char_length(role_summary) between 1 and 800),
  match_score integer not null check (match_score between 0 and 100),
  match_label text not null check (match_label in ('Strong Match', 'Potential Match', 'Stretch')),
  breakdown jsonb not null,
  alignments jsonb not null,
  gaps jsonb not null,
  recommendation text not null check (char_length(recommendation) between 1 and 800),
  next_steps jsonb not null,
  safe_trace jsonb not null,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  company text not null check (char_length(btrim(company)) between 1 and 120),
  context text check (context is null or char_length(context) <= 500),
  profile_url text check (profile_url is null or char_length(profile_url) <= 300),
  relevance text not null check (
    relevance in (
      'hiring_manager',
      'recruiter',
      'engineering_leader',
      'potential_teammate',
      'low_relevance'
    )
  ),
  relevance_reason text not null check (char_length(relevance_reason) between 1 and 240),
  source text not null check (source in ('manual', 'demo')),
  created_at timestamptz not null default now(),
  unique (application_id, source, name)
);

create table public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  channel text not null check (channel in ('linkedin', 'email')),
  subject text check (subject is null or char_length(subject) between 1 and 100),
  message text not null check (char_length(message) between 1 and 1500),
  original_message text not null check (char_length(original_message) between 1 and 1500),
  original_subject text check (original_subject is null or char_length(original_subject) between 1 and 100),
  status text not null check (status in ('awaiting_review', 'approved', 'rejected')),
  human_edited boolean not null default false,
  grounding jsonb not null,
  safe_trace jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_created_at_idx on public.applications (created_at desc);
create index applications_status_idx on public.applications (status);
create index analyses_application_id_idx on public.analyses (application_id);
create index contacts_application_id_idx on public.contacts (application_id);
create index outreach_drafts_application_id_idx on public.outreach_drafts (application_id);
create index outreach_drafts_contact_id_idx on public.outreach_drafts (contact_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create trigger outreach_drafts_updated_at
before update on public.outreach_drafts
for each row execute function public.set_updated_at();

alter table public.applications enable row level security;
alter table public.analyses enable row level security;
alter table public.contacts enable row level security;
alter table public.outreach_drafts enable row level security;

revoke all on table public.applications from anon, authenticated;
revoke all on table public.analyses from anon, authenticated;
revoke all on table public.contacts from anon, authenticated;
revoke all on table public.outreach_drafts from anon, authenticated;
