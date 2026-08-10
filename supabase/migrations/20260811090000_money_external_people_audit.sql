alter table public.bills
  add column if not exists paid_by_type text not null default 'member',
  add column if not exists paid_by_name text;

alter table public.bills
  add constraint bills_paid_by_type_check
  check (paid_by_type in ('member', 'external'));

alter table public.bills
  add constraint bills_paid_by_person_check
  check (
    (paid_by_type = 'member' and paid_by_name is null)
    or (
      paid_by_type = 'external'
      and paid_by is null
      and nullif(trim(paid_by_name), '') is not null
    )
  );

alter table public.income
  add column if not exists received_by_type text not null default 'member',
  add column if not exists received_by_name text,
  alter column received_by drop not null;

alter table public.income
  add constraint income_received_by_type_check
  check (received_by_type in ('member', 'external'));

alter table public.income
  add constraint income_received_by_person_check
  check (
    (
      received_by_type = 'member'
      and received_by is not null
      and received_by_name is null
    )
    or (
      received_by_type = 'external'
      and received_by is null
      and nullif(trim(received_by_name), '') is not null
    )
  );

alter table public.goal_contributions
  add column if not exists contributed_by_type text not null default 'member',
  add column if not exists contributed_by_name text,
  alter column contributed_by drop not null;

alter table public.goal_contributions
  add constraint goal_contributions_contributed_by_type_check
  check (contributed_by_type in ('member', 'external'));

alter table public.goal_contributions
  add constraint goal_contributions_contributed_by_person_check
  check (
    (
      contributed_by_type = 'member'
      and contributed_by is not null
      and contributed_by_name is null
    )
    or (
      contributed_by_type = 'external'
      and contributed_by is null
      and nullif(trim(contributed_by_name), '') is not null
    )
  );
