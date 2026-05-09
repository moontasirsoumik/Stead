-- Add done_by column to groceries table for attribution tracking
alter table groceries
  add column if not exists done_by uuid references members(id) on delete set null;
