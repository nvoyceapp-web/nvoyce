-- Create subscriptions table
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'active' check (status in ('active', 'cancelled', 'past_due')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast user lookups
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);

-- RLS
alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (auth.uid()::text = user_id);

-- Allow service role full access (for webhook updates)
create policy "Service role full access"
  on subscriptions for all
  using (true)
  with check (true);
