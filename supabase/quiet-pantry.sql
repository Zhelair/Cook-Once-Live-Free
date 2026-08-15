-- Quiet Pantry: auth + entitlement only. User recipes, flyers, receipts and plans
-- deliberately remain in the browser's IndexedDB and are never stored here.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  credits_remaining integer not null default 310 check (credits_remaining >= 0),
  credit_period_started_at timestamptz not null default now(),
  credit_period_ends_at timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;

create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can read their own ledger" on public.credit_ledger for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Debit must be atomic: API calls this with the service role after verifying the signed-in user.
create or replace function public.consume_ai_credits(p_user_id uuid, p_amount integer, p_action text)
returns table(success boolean, credits_remaining integer, message text)
language plpgsql security definer set search_path = public as $$
declare profile_row public.profiles%rowtype; monthly_allowance integer;
begin
  select * into profile_row from public.profiles where id = p_user_id for update;
  if not found then return query select false, 0, 'Profile not found'; return; end if;
  if profile_row.credit_period_ends_at <= now() then
    monthly_allowance := case when profile_row.plan = 'pro' then 3100 else 310 end;
    update public.profiles set credits_remaining = monthly_allowance, credit_period_started_at = now(), credit_period_ends_at = now() + interval '1 month', updated_at = now() where id = p_user_id returning * into profile_row;
  end if;
  if profile_row.credits_remaining < p_amount then return query select false, profile_row.credits_remaining, 'You need 31 credits for this AI action.'; return; end if;
  update public.profiles set credits_remaining = credits_remaining - p_amount, updated_at = now() where id = p_user_id returning * into profile_row;
  insert into public.credit_ledger(user_id, amount, action) values (p_user_id, -p_amount, p_action);
  return query select true, profile_row.credits_remaining, 'Credits used';
end;
$$;

create or replace function public.refund_ai_credits(p_user_id uuid, p_amount integer, p_action text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set credits_remaining = credits_remaining + p_amount, updated_at = now() where id = p_user_id;
  insert into public.credit_ledger(user_id, amount, action) values (p_user_id, p_amount, p_action);
end;
$$;

revoke all on function public.consume_ai_credits(uuid, integer, text) from public;
revoke all on function public.refund_ai_credits(uuid, integer, text) from public;
grant execute on function public.consume_ai_credits(uuid, integer, text) to service_role;
grant execute on function public.refund_ai_credits(uuid, integer, text) to service_role;
