-- ============================================================
-- Stead — Dummy Data Seed Script
-- Run this in the Supabase SQL editor (bypasses RLS as postgres).
-- Safe to re-run: household/member lookup is idempotent.
-- Targets: Alice Chen's account + full household data.
-- Generated: 2026-06-13
-- ============================================================

DO $$
DECLARE
  v_hh_id     uuid;
  v_alice_id  uuid;   -- Alice Chen (admin)
  v_bob_id    uuid;   -- Bob Rivera
  v_chloe_id  uuid;   -- Chloe Kim
  v_derek_id  uuid;   -- Derek Patel

  v_goal1     uuid;   -- savings goal: Greece holiday
  v_goal2     uuid;   -- savings goal: MacBook
  v_goal3     uuid;   -- savings goal: Emergency fund

  v_task_gr   uuid;   -- task: Plan Greece itinerary (for subtasks)
  v_task_kc   uuid;   -- task: Deep clean kitchen (completed, for subtasks)

  v_board1    uuid;   -- board: Greece trip
  v_board2    uuid;   -- board: Home improvements
  v_board3    uuid;   -- board: Alice work focus

  v_tracker1  uuid;   -- tracker: daily steps
  v_tracker2  uuid;   -- tracker: sleep
  v_tracker3  uuid;   -- tracker: run distance

  d date;
BEGIN

  -- ================================================================
  -- 0. Find or create household + members
  --    Migration 013 inserts Alice Chen etc. only if a household
  --    already exists.  We create one if still missing.
  -- ================================================================

  SELECT household_id INTO v_hh_id
  FROM members WHERE name = 'Alice Chen' AND active = true LIMIT 1;

  IF v_hh_id IS NULL THEN
    INSERT INTO households (name)
    VALUES ('Chen-Rivera Home')
    RETURNING id INTO v_hh_id;
  END IF;

  -- Alice Chen (admin)
  SELECT id INTO v_alice_id FROM members
  WHERE household_id = v_hh_id AND name = 'Alice Chen' LIMIT 1;
  IF v_alice_id IS NULL THEN
    INSERT INTO members (household_id, name, role, color, active)
    VALUES (v_hh_id, 'Alice Chen', 'admin', '#E57373', true)
    RETURNING id INTO v_alice_id;
  END IF;

  -- Bob Rivera
  SELECT id INTO v_bob_id FROM members
  WHERE household_id = v_hh_id AND name = 'Bob Rivera' LIMIT 1;
  IF v_bob_id IS NULL THEN
    INSERT INTO members (household_id, name, role, color, active)
    VALUES (v_hh_id, 'Bob Rivera', 'member', '#64B5F6', true)
    RETURNING id INTO v_bob_id;
  END IF;

  -- Chloe Kim
  SELECT id INTO v_chloe_id FROM members
  WHERE household_id = v_hh_id AND name = 'Chloe Kim' LIMIT 1;
  IF v_chloe_id IS NULL THEN
    INSERT INTO members (household_id, name, role, color, active)
    VALUES (v_hh_id, 'Chloe Kim', 'member', '#81C784', true)
    RETURNING id INTO v_chloe_id;
  END IF;

  -- Derek Patel
  SELECT id INTO v_derek_id FROM members
  WHERE household_id = v_hh_id AND name = 'Derek Patel' LIMIT 1;
  IF v_derek_id IS NULL THEN
    INSERT INTO members (household_id, name, role, color, active)
    VALUES (v_hh_id, 'Derek Patel', 'member', '#FFB74D', true)
    RETURNING id INTO v_derek_id;
  END IF;

  -- ================================================================
  -- 1. Mark stale open tasks as done (maintenance + regular)
  -- ================================================================

  UPDATE tasks
  SET status       = 'done',
      completed_at = created_at + interval '4 days',
      updated_at   = created_at + interval '4 days',
      updated_by   = v_alice_id
  WHERE household_id = v_hh_id
    AND status IN ('not_started', 'in_progress')
    AND created_at  < CURRENT_DATE - interval '28 days'
    AND deleted = false;

  UPDATE tasks
  SET status        = 'done',
      completed_at  = due_date,
      last_done_date = due_date,
      updated_at    = now(),
      updated_by    = v_alice_id
  WHERE household_id = v_hh_id
    AND task_type   = 'maintenance'
    AND status     != 'done'
    AND due_date    < CURRENT_DATE - interval '10 days'
    AND deleted     = false;

  -- ================================================================
  -- 2. Expenses — 90 days of realistic household spending
  --    Amounts in euro-cents (integer).
  -- ================================================================

  INSERT INTO expenses
    (household_id, date, amount, category, subcategory, description,
     paid_by, shared, scope, updated_by)
  VALUES
    -- ── April (90–71 days ago) ──
    (v_hh_id, CURRENT_DATE-90,  8540,'Food','Groceries','Lidl weekly shop',                 v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-89,  3200,'Transport','Fuel','Shell station fill-up',             v_bob_id,  false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-87,  1150,'Food','Coffee','Espresso House ×3',                    v_chloe_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-85,  9800,'Utilities','Electricity','Helen April bill',           v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-83,  4620,'Food','Restaurants','Italian trattoria dinner',        v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-80,  7630,'Food','Groceries','K-Citymarket Saturday shop',        v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-78,  2080,'Health','Pharmacy','Vitamins + allergy tablets',       v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-76, 14900,'Home','Furniture','IKEA Billy bookshelf ×2',           v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-73,  3860,'Entertainment','Events','Theatre tickets ×2',          v_derek_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-71,  6180,'Food','Groceries','S-Market Saturday run',             v_bob_id,  true, 'household',v_alice_id),
    -- ── May (55–36 days ago) ──
    (v_hh_id, CURRENT_DATE-55,  5490,'Food','Groceries','Prisma weekly shop',                v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-53,180000,'Housing','Rent','May rent payment',                    v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-51,  2800,'Transport','Public transit','HSL monthly pass',        v_chloe_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-49,  1620,'Food','Coffee','Wayne''s Coffee + pastry',             v_derek_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-47,  7810,'Food','Groceries','Lidl double run',                   v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-45,  3500,'Health','Gym','May gym membership (Alice)',             v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-43,  9180,'Home','Supplies','Cleaning supplies bulk buy',         v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-41,  4340,'Food','Restaurants','Thai takeaway ×2',                v_chloe_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-38,  6730,'Utilities','Internet','DNA broadband May bill',        v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-36, 11490,'Clothing',NULL,'Uniqlo summer sale haul',              v_bob_id,  false,'household',v_alice_id),
    -- ── June — recent (20–0 days ago) ──
    (v_hh_id, CURRENT_DATE-20,  5920,'Food','Groceries','K-Supermarket Tuesday',             v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-18,  2200,'Health','Medical','GP appointment co-pay',             v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-16,  8750,'Food','Groceries','Prisma + Lidl combo run',           v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-14,  3100,'Entertainment','Streaming','Netflix + Spotify renewal',v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-12,  4720,'Food','Restaurants','Sushi Bar Ichiban',               v_chloe_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-10,180000,'Housing','Rent','June rent payment',                   v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-8,   6120,'Food','Groceries','Weekend grocery haul',              v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-6,   1790,'Transport','Taxi','Bolt to airport — Derek',           v_derek_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-4,   3310,'Health','Pharmacy','Antihistamines + sunscreen',       v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-2,   7420,'Food','Groceries','Lidl + Fazer bakery',               v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE,     2580,'Food','Coffee','Work coffee run + pastries',           v_alice_id,false,'household',v_alice_id);

  -- ================================================================
  -- 3. Income — salary + occasional freelance
  -- ================================================================

  INSERT INTO income
    (household_id, date, amount, source, category, received_by, recurring, scope, updated_by)
  VALUES
    (v_hh_id, CURRENT_DATE-90, 310000,'TechCorp Oy',   'Salary',   v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-89, 240000,'StartupXYZ',    'Salary',   v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-75,  12500,'Fiverr project','Freelance',v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-60, 310000,'TechCorp Oy',   'Salary',   v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-59, 240000,'StartupXYZ',    'Salary',   v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-45,   8500,'S-Bonus card',  'Cashback', v_alice_id,false,'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-30, 310000,'TechCorp Oy',   'Salary',   v_alice_id,true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-29, 240000,'StartupXYZ',    'Salary',   v_bob_id,  true, 'household',v_alice_id),
    (v_hh_id, CURRENT_DATE-15,  18000,'Design client', 'Freelance',v_alice_id,false,'household',v_alice_id);

  -- ================================================================
  -- 4. Bills
  -- ================================================================

  INSERT INTO bills
    (household_id, name, amount, category, due_day, frequency,
     auto_pay, paid_by, status, last_paid_date, note, updated_by)
  VALUES
    (v_hh_id,'Apartment Rent',        180000,'Housing',   1,'monthly',  false,v_alice_id,'paid',    CURRENT_DATE-10,'Bank transfer to landlord',       v_alice_id),
    (v_hh_id,'Electricity (Helen Oy)',   7800,'Utilities', 15,'monthly', true, v_alice_id,'upcoming',NULL,           'Direct debit, ~€78/month',         v_alice_id),
    (v_hh_id,'DNA Broadband 1 Gbps',    3490,'Utilities', 20,'monthly', true, v_alice_id,'paid',    CURRENT_DATE-23,'Auto-charge to card',               v_alice_id),
    (v_hh_id,'Water (HSY)',             2200,'Utilities', 10,'quarterly',false,v_alice_id,'paid',    CURRENT_DATE-55,'Invoice billing, quarterly',        v_alice_id),
    (v_hh_id,'Home Contents Insurance',14900,'Insurance',  1,'annual',  false,v_alice_id,'paid',    CURRENT_DATE-160,'If Vakuutus policy #4421',          v_alice_id),
    (v_hh_id,'Car Insurance (Bob)',      9800,'Insurance',  5,'monthly', true, v_bob_id,  'upcoming',NULL,           'LähiTapiola, auto-renew',           v_alice_id),
    (v_hh_id,'Elisa Mobile — Alice',    2490,'Utilities', 18,'monthly', true, v_alice_id,'paid',    CURRENT_DATE-25,'Unlimited 5G plan',                 v_alice_id),
    (v_hh_id,'Telia Mobile — Bob',      1990,'Utilities', 18,'monthly', true, v_bob_id,  'upcoming',NULL,           '50 GB plan',                        v_alice_id),
    (v_hh_id,'Condo Maintenance Fee',  35000,'Housing',   28,'monthly', true, v_alice_id,'paid',    CURRENT_DATE-15,'Taloyhtiö monthly charge',           v_alice_id);

  -- ================================================================
  -- 5. Budgets — three months
  -- ================================================================

  INSERT INTO budgets
    (household_id, month, category, budget_amount, scope, updated_by)
  VALUES
    -- Two months ago
    (v_hh_id,to_char(CURRENT_DATE-interval'2 months','YYYY-MM'),'Food',        30000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'2 months','YYYY-MM'),'Transport',    8000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'2 months','YYYY-MM'),'Entertainment',10000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'2 months','YYYY-MM'),'Health',        5000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'2 months','YYYY-MM'),'Home',         15000,'household',v_alice_id),
    -- Last month
    (v_hh_id,to_char(CURRENT_DATE-interval'1 month','YYYY-MM'), 'Food',        28000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'1 month','YYYY-MM'), 'Transport',    8000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'1 month','YYYY-MM'), 'Entertainment', 8000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'1 month','YYYY-MM'), 'Health',        6000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE-interval'1 month','YYYY-MM'), 'Utilities',   20000,'household',v_alice_id),
    -- This month
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Food',        30000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Transport',    8000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Entertainment',10000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Health',        5000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Home',         20000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Utilities',    20000,'household',v_alice_id),
    (v_hh_id,to_char(CURRENT_DATE,'YYYY-MM'),'Clothing',      8000,'household',v_alice_id);

  -- ================================================================
  -- 6. Savings Goals + Contributions
  -- ================================================================

  INSERT INTO savings_goals
    (household_id, name, target_amount, current_amount, deadline,
     priority, status, note, scope, updated_by)
  VALUES
    (v_hh_id,'Greece Holiday 2026',400000,280000,CURRENT_DATE+65,
     'high','active','Santorini + Athens, 10 days, budget ~€4 000',
     'household',v_alice_id)
  RETURNING id INTO v_goal1;

  INSERT INTO savings_goals
    (household_id, name, target_amount, current_amount, deadline,
     priority, status, note, scope, updated_by)
  VALUES
    (v_hh_id,'New MacBook Pro (M4)',200000,95000,CURRENT_DATE+120,
     'medium','active','Replacing 2022 MBP — wait for good deal',
     'household',v_alice_id)
  RETURNING id INTO v_goal2;

  INSERT INTO savings_goals
    (household_id, name, target_amount, current_amount, deadline,
     priority, status, note, scope, updated_by)
  VALUES
    (v_hh_id,'Emergency Fund (3 months)',500000,375000,CURRENT_DATE+180,
     'high','active','Target: 3× monthly expenses. Currently ~75% there.',
     'household',v_alice_id)
  RETURNING id INTO v_goal3;

  -- Reached goal (sofa)
  INSERT INTO savings_goals
    (household_id, name, target_amount, current_amount, deadline,
     priority, status, note, scope, updated_by)
  VALUES
    (v_hh_id,'New IKEA SÖDERHAMN Sofa',80000,80000,CURRENT_DATE-20,
     'low','reached','Ordered and delivered June 1st!',
     'household',v_alice_id);

  INSERT INTO goal_contributions
    (household_id, goal_id, amount, date, contributed_by, note, scope, updated_by)
  VALUES
    (v_hh_id,v_goal1, 50000,CURRENT_DATE-85,v_alice_id,'Initial transfer to holiday fund',      'household',v_alice_id),
    (v_hh_id,v_goal1, 30000,CURRENT_DATE-55,v_alice_id,'Monthly save — April paycheck portion', 'household',v_alice_id),
    (v_hh_id,v_goal1, 30000,CURRENT_DATE-25,v_bob_id,  'Bob''s contribution — May',             'household',v_alice_id),
    (v_hh_id,v_goal2, 25000,CURRENT_DATE-80,v_alice_id,'Started MacBook fund',                  'household',v_alice_id),
    (v_hh_id,v_goal2, 35000,CURRENT_DATE-50,v_alice_id,'Freelance project payment',             'household',v_alice_id),
    (v_hh_id,v_goal2, 35000,CURRENT_DATE-20,v_alice_id,'Monthly save — June',                   'household',v_alice_id),
    (v_hh_id,v_goal3, 50000,CURRENT_DATE-90,v_alice_id,'Opening contribution',                  'household',v_alice_id),
    (v_hh_id,v_goal3, 75000,CURRENT_DATE-60,v_alice_id,'Large top-up after bonus',              'household',v_alice_id),
    (v_hh_id,v_goal3, 50000,CURRENT_DATE-30,v_alice_id,'May monthly save',                      'household',v_alice_id),
    (v_hh_id,v_goal3, 50000,CURRENT_DATE-5, v_alice_id,'June top-up',                           'household',v_alice_id);

  -- ================================================================
  -- 7. Tasks — completed old + active current + upcoming
  -- ================================================================

  -- ── Completed (older) ──
  INSERT INTO tasks
    (household_id, title, description, assignee, room, category,
     due_date, priority, status, completed_at, scope, visibility,
     task_type, created_by, updated_by, created_at, updated_at)
  VALUES
    (v_hh_id,'Deep clean kitchen','Oven, hob, fridge, all surfaces',
     v_alice_id,'Kitchen','Cleaning',CURRENT_DATE-68,'high','done',
     CURRENT_DATE-68,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-80,CURRENT_DATE-68),
    (v_hh_id,'Fix leaky bathroom tap',NULL,
     v_bob_id,'Bathroom','Repairs',CURRENT_DATE-58,'high','done',
     CURRENT_DATE-58,'household','household','maintenance',v_alice_id,v_alice_id,
     CURRENT_DATE-75,CURRENT_DATE-58),
    (v_hh_id,'Assemble IKEA bookshelves','Billy ×2 in living room',
     v_bob_id,'Living Room','Setup',CURRENT_DATE-48,'medium','done',
     CURRENT_DATE-47,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-60,CURRENT_DATE-47),
    (v_hh_id,'File Q1 tax documents','Gather receipts + send to accountant',
     v_alice_id,NULL,'Admin',CURRENT_DATE-43,'high','done',
     CURRENT_DATE-43,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-60,CURRENT_DATE-43),
    (v_hh_id,'Replace smoke detector batteries','All 3 detectors',
     v_derek_id,NULL,'Safety',CURRENT_DATE-38,'medium','done',
     CURRENT_DATE-38,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-50,CURRENT_DATE-38),
    (v_hh_id,'Service washing machine filter',NULL,
     v_bob_id,'Utility','Maintenance',CURRENT_DATE-33,'medium','done',
     CURRENT_DATE-33,'household','household','maintenance',v_alice_id,v_alice_id,
     CURRENT_DATE-50,CURRENT_DATE-33),
    (v_hh_id,'Renew home insurance','Compare quotes first, then call If',
     v_alice_id,NULL,'Admin',CURRENT_DATE-28,'high','done',
     CURRENT_DATE-28,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-45,CURRENT_DATE-28),
    (v_hh_id,'Install blackout curtains — bedroom',NULL,
     v_chloe_id,'Bedroom','Home',CURRENT_DATE-20,'low','done',
     CURRENT_DATE-20,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-35,CURRENT_DATE-20),
    (v_hh_id,'Submit Q2 tax estimate','Via Ahmad the accountant',
     v_alice_id,NULL,'Finance',CURRENT_DATE-18,'high','done',
     CURRENT_DATE-18,'household','household','regular',v_alice_id,v_alice_id,
     CURRENT_DATE-30,CURRENT_DATE-18);

  -- ── Active / in-progress ──
  INSERT INTO tasks
    (household_id, title, description, assignee, room, category,
     due_date, priority, status, scope, visibility, task_type,
     created_by, updated_by)
  VALUES
    (v_hh_id,'Book dentist appointments','Alice + Bob 6-month check-up overdue',
     v_alice_id,NULL,'Health',CURRENT_DATE+7,'medium','not_started',
     'household','household','regular',v_alice_id,v_alice_id),
    (v_hh_id,'Organise linen closet','Donate old towels and sheets to charity',
     v_chloe_id,'Bedroom','Organisation',CURRENT_DATE+5,'low','in_progress',
     'household','household','regular',v_alice_id,v_alice_id),
    (v_hh_id,'Repot the monstera plant','Root-bound — needs 30 cm pot',
     v_alice_id,'Living Room','Gardening',CURRENT_DATE+3,'low','not_started',
     'household','household','regular',v_alice_id,v_alice_id),
    (v_hh_id,'Car tyre pressure check','All 4 tyres before summer road trip',
     v_bob_id,NULL,'Car',CURRENT_DATE+10,'medium','not_started',
     'household','household','maintenance',v_alice_id,v_alice_id),
    (v_hh_id,'Clean gutters before July','Summer rain prep',
     v_bob_id,NULL,'Maintenance',CURRENT_DATE+15,'medium','not_started',
     'household','household','maintenance',v_alice_id,v_alice_id),
    (v_hh_id,'Schedule AC service','Summer heat incoming — book before queue',
     NULL,NULL,'Maintenance',CURRENT_DATE+25,'medium','not_started',
     'household','household','maintenance',v_alice_id,v_alice_id),
    (v_hh_id,'Landlord apartment inspection prep','Annual condition check on the 30th',
     v_alice_id,NULL,'Home',CURRENT_DATE+20,'high','in_progress',
     'household','household','regular',v_alice_id,v_alice_id);

  -- Greece planning task (for subtasks below)
  INSERT INTO tasks
    (household_id, title, description, assignee, category,
     due_date, priority, status, scope, visibility, task_type,
     created_by, updated_by)
  VALUES
    (v_hh_id,'Plan Greece trip itinerary','Flights, accommodation, activities',
     v_alice_id,'Travel',CURRENT_DATE+20,'high','in_progress',
     'household','household','regular',v_alice_id,v_alice_id)
  RETURNING id INTO v_task_gr;

  -- ── Personal tasks for Alice ──
  INSERT INTO tasks
    (household_id, title, description, assignee, priority, status,
     due_date, scope, visibility, task_type, owner_id, created_by, updated_by)
  VALUES
    (v_hh_id,'Finish React course on Udemy','Modules 12–18 remaining',
     v_alice_id,'medium','in_progress',CURRENT_DATE+30,
     'personal','private','regular',v_alice_id,v_alice_id,v_alice_id),
    (v_hh_id,'Write blog post — Supabase vs Firebase','70% draft done',
     v_alice_id,'low','in_progress',CURRENT_DATE+14,
     'personal','private','regular',v_alice_id,v_alice_id,v_alice_id),
    (v_hh_id,'Prepare Q3 feature breakdown','Present to team July 7',
     v_alice_id,'high','not_started',CURRENT_DATE+24,
     'personal','private','regular',v_alice_id,v_alice_id,v_alice_id),
    (v_hh_id,'Read "Atomic Habits"','120 pages left — finish this month',
     v_alice_id,'low','in_progress',CURRENT_DATE+21,
     'personal','private','regular',v_alice_id,v_alice_id,v_alice_id);

  -- Get completed kitchen task for subtasks
  SELECT id INTO v_task_kc FROM tasks
  WHERE household_id = v_hh_id AND title = 'Deep clean kitchen' LIMIT 1;

  -- ── Subtasks ──
  IF v_task_gr IS NOT NULL THEN
    INSERT INTO subtasks
      (household_id, task_id, title, done, "order", updated_by)
    VALUES
      (v_hh_id,v_task_gr,'Research Athens vs Santorini routing',          false,0,v_alice_id),
      (v_hh_id,v_task_gr,'Compare flights (Finnair, Ryanair, easyJet)',   false,1,v_alice_id),
      (v_hh_id,v_task_gr,'Book flights HEL → ATH once decided',           false,2,v_alice_id),
      (v_hh_id,v_task_gr,'Find Airbnb in Santorini (Fira or Oia)',        false,3,v_alice_id),
      (v_hh_id,v_task_gr,'Apply for travel insurance (If Vakuutus)',       false,4,v_alice_id),
      (v_hh_id,v_task_gr,'Book Acropolis timed entry in advance',          false,5,v_alice_id);
  END IF;

  IF v_task_kc IS NOT NULL THEN
    INSERT INTO subtasks
      (household_id, task_id, title, done, "order", updated_by)
    VALUES
      (v_hh_id,v_task_kc,'Clean oven interior',              true,0,v_alice_id),
      (v_hh_id,v_task_kc,'Degrease hob and burners',         true,1,v_alice_id),
      (v_hh_id,v_task_kc,'Empty + wipe all fridge shelves',  true,2,v_alice_id),
      (v_hh_id,v_task_kc,'Mop floor and scrub grout',        true,3,v_alice_id);
  END IF;

  -- ================================================================
  -- 8. Groceries
  -- ================================================================

  INSERT INTO groceries
    (household_id, name, quantity, unit, category, priority,
     assigned_to, status, preferred_store, note, updated_by)
  VALUES
    (v_hh_id,'Oat milk',          4,'carton','Dairy alternative','medium',v_alice_id,'needed',  'Lidl',        NULL,                         v_alice_id),
    (v_hh_id,'Free-range eggs',  12,'pcs',   'Eggs',            'high',  v_alice_id,'needed',  'K-Market',    NULL,                         v_alice_id),
    (v_hh_id,'Sourdough bread',   1,'loaf',  'Bakery',          'medium',v_bob_id,  'needed',  'Fazer bakery',NULL,                         v_alice_id),
    (v_hh_id,'Chicken breast',  800,'g',     'Meat',            'high',  v_alice_id,'needed',  'K-Citymarket',NULL,                         v_alice_id),
    (v_hh_id,'Baby spinach',    200,'g',     'Vegetables',      'medium',v_chloe_id,'needed',  'Lidl',        NULL,                         v_alice_id),
    (v_hh_id,'Greek yoghurt',     2,'tubs',  'Dairy',           'medium',v_alice_id,'needed',  'K-Market',    'Fage Total 0%',              v_alice_id),
    (v_hh_id,'Coffee beans',    500,'g',     'Beverages',       'high',  v_alice_id,'needed',  'Prisma',      'Paulig dark roast',          v_alice_id),
    (v_hh_id,'Salmon fillet',   500,'g',     'Fish',            'high',  v_alice_id,'needed',  'K-Citymarket',NULL,                         v_alice_id),
    (v_hh_id,'Avocado',           3,'pcs',   'Fruits',          'medium',v_alice_id,'in_cart', 'K-Market',    NULL,                         v_alice_id),
    (v_hh_id,'Penne pasta',       3,'packs', 'Dry goods',       'low',   v_alice_id,'in_cart', 'Lidl',        NULL,                         v_alice_id),
    (v_hh_id,'Olive oil',         1,'bottle','Oils',            'medium',v_bob_id,  'in_cart', 'Prisma',      'Borges extra virgin 1L',     v_alice_id),
    (v_hh_id,'Cherry tomatoes', 400,'g',     'Vegetables',      'medium',v_chloe_id,'bought',  'Lidl',        NULL,                         v_alice_id),
    (v_hh_id,'Dark chocolate',    2,'bars',  'Snacks',          'low',   v_alice_id,'bought',  'Lidl',        '70% cacao',                  v_alice_id),
    (v_hh_id,'Almond butter',     1,'jar',   'Spreads',         'medium',v_alice_id,'bought',  'Prisma',      NULL,                         v_alice_id),
    (v_hh_id,'Sparkling water',   1,'24-pack','Beverages',      'low',   v_bob_id,  'bought',  'Lidl',        'Lidl own brand, 24×500ml',   v_alice_id);

  -- ================================================================
  -- 9. Inventory
  -- ================================================================

  INSERT INTO inventory
    (household_id, name, category, location, stock_status, target_level,
     restock_needed, last_checked_date, note, updated_by)
  VALUES
    (v_hh_id,'Laundry detergent', 'Cleaning','Utility room',    'low',           'keep_2',     true, CURRENT_DATE-3, 'Almost out — buy Ariel next shop',        v_alice_id),
    (v_hh_id,'Dishwasher tablets','Cleaning','Under sink',      'enough',        'keep_2',     false,CURRENT_DATE-5, 'Fairy Platinum 60-pack, ~half left',      v_alice_id),
    (v_hh_id,'Toilet rolls',      'Bathroom','Bathroom cabinet','enough',        'keep_3_plus',false,CURRENT_DATE-1, '18-pack from Lidl',                       v_alice_id),
    (v_hh_id,'Paracetamol',       'Medicine','Medicine cabinet','low',           'keep_2',     true, CURRENT_DATE-7, 'Only 4 tablets left',                     v_alice_id),
    (v_hh_id,'Hand soap (pump)',  'Bathroom','Both bathrooms',  'enough',        'keep_2',     false,CURRENT_DATE-2, 'Palmolive — refill pack in utility room', v_alice_id),
    (v_hh_id,'Coffee beans',      'Kitchen', 'Kitchen pantry',  'almost_finished','weekly_item',true,CURRENT_DATE,   '~150 g left in bag, running low',         v_alice_id),
    (v_hh_id,'Olive oil',         'Kitchen', 'Kitchen pantry',  'enough',        'keep_1',     false,CURRENT_DATE-4, 'New 1 L bottle opened this week',         v_alice_id),
    (v_hh_id,'Bin bags 80 L',     'Cleaning','Utility room',    'extra_stock',   'keep_2',     false,CURRENT_DATE-10,'3 rolls of 20 — well stocked',           v_alice_id),
    (v_hh_id,'LED bulbs E27',     'Home',    'Bedroom wardrobe','enough',        'keep_1',     false,CURRENT_DATE-20,'4 spare bulbs, 6 500 K',                  v_alice_id),
    (v_hh_id,'Batteries AA',      'Home',    'Junk drawer',     'low',           'keep_2',     false,CURRENT_DATE-15,'Only 2 left',                             v_alice_id),
    (v_hh_id,'Shower gel',        'Bathroom','Shower shelf',    'enough',        'keep_2',     false,CURRENT_DATE-1, 'L''Occitane + 2 backup bottles',          v_alice_id),
    (v_hh_id,'Ibuprofen 200 mg',  'Medicine','Medicine cabinet','enough',        'keep_1',     false,CURRENT_DATE-7, '24 tablets, exp Jan 2028',                v_alice_id),
    (v_hh_id,'Rice jasmine 2 kg', 'Kitchen', 'Kitchen pantry',  'enough',        'monthly_item',false,CURRENT_DATE-5,'2/3 of bag remaining',                   v_alice_id),
    (v_hh_id,'Pasta (assorted)',  'Kitchen', 'Kitchen pantry',  'enough',        'keep_3_plus',false,CURRENT_DATE-3, 'Penne, spaghetti, fusilli',               v_alice_id),
    (v_hh_id,'WD-40',             'Home',    'Tool drawer',     'enough',        'keep_1',     false,CURRENT_DATE-30,'For squeaky door hinges',                 v_alice_id);

  -- ================================================================
  -- 10. Calendar Events
  -- ================================================================

  INSERT INTO calendar_events
    (household_id, title, description, start_date, end_date, all_day,
     category, assigned_to, scope, owner_id, color, visibility, updated_by)
  VALUES
    -- Past
    (v_hh_id,'IKEA furniture delivery','Billy bookshelves ×2',
     CURRENT_DATE-48,CURRENT_DATE-48,true,'Home',v_bob_id,
     'household',v_alice_id,'#4CAF50','household',v_alice_id),
    (v_hh_id,'Bob''s birthday dinner','Restaurant reservation: Grön',
     CURRENT_DATE-40,CURRENT_DATE-40,true,'Social',NULL,
     'household',v_alice_id,'#E91E63','household',v_alice_id),
    (v_hh_id,'Home insurance renewal','Called If Vakuutus — renewed at same price',
     CURRENT_DATE-28,CURRENT_DATE-28,true,'Admin',v_alice_id,
     'household',v_alice_id,'#FF9800','household',v_alice_id),
    (v_hh_id,'Car service — annual','AutoClinic, brake pads + tyre rotation',
     CURRENT_DATE-5,CURRENT_DATE-5,true,'Car',v_bob_id,
     'household',v_alice_id,'#607D8B','household',v_alice_id),
    -- Upcoming
    (v_hh_id,'Electricity bill due',NULL,
     CURRENT_DATE+2,CURRENT_DATE+2,true,'Finance',v_alice_id,
     'household',v_alice_id,'#FF9800','household',v_alice_id),
    (v_hh_id,'Chloe''s graduation party','At her parents'' place in Espoo',
     CURRENT_DATE+14,CURRENT_DATE+14,true,'Social',NULL,
     'household',v_alice_id,'#E91E63','household',v_alice_id),
    (v_hh_id,'Dentist — Alice','6-month check-up and cleaning',
     CURRENT_DATE+7,CURRENT_DATE+7,false,'Health',v_alice_id,
     'household',v_alice_id,'#2196F3','household',v_alice_id),
    (v_hh_id,'Dentist — Bob','6-month check-up and cleaning',
     CURRENT_DATE+8,CURRENT_DATE+8,false,'Health',v_bob_id,
     'household',v_alice_id,'#2196F3','household',v_alice_id),
    (v_hh_id,'Landlord apartment inspection','Annual condition check',
     CURRENT_DATE+30,CURRENT_DATE+30,true,'Home',v_alice_id,
     'household',v_alice_id,'#FF5722','household',v_alice_id),
    (v_hh_id,'Bob work conference — Stockholm','Travel + 2 nights',
     CURRENT_DATE+35,CURRENT_DATE+37,true,'Work',v_bob_id,
     'household',v_alice_id,'#607D8B','household',v_alice_id),
    (v_hh_id,'Greece holiday ✈','Fly HEL → ATH, 10 days',
     CURRENT_DATE+65,CURRENT_DATE+75,true,'Travel',NULL,
     'household',v_alice_id,'#9C27B0','household',v_alice_id),
    -- Personal (Alice)
    (v_hh_id,'Performance review prep','Write self-assessment doc',
     CURRENT_DATE+3,CURRENT_DATE+3,true,'Work',v_alice_id,
     'personal',v_alice_id,'#3F51B5','private',v_alice_id),
    (v_hh_id,'Yoga — Sunday vinyasa','Studio Verso, 9 am',
     CURRENT_DATE+6,CURRENT_DATE+6,false,'Health',v_alice_id,
     'personal',v_alice_id,'#009688','private',v_alice_id),
    (v_hh_id,'Call mum','Catch up + plan summer visit',
     CURRENT_DATE+4,CURRENT_DATE+4,true,'Family',v_alice_id,
     'personal',v_alice_id,'#E91E63','private',v_alice_id);

  -- ================================================================
  -- 11. Wishlists (Alice personal)
  -- ================================================================

  INSERT INTO wishlists
    (household_id, owner_id, name, description, url, price,
     priority, status, saved_amount, category, note, visibility)
  VALUES
    (v_hh_id,v_alice_id,'Kindle Scribe','E-ink tablet for reading + handwriting notes',
     '',35000,'medium','saving',18000,'Electronics',
     'Wait for next Prime Day sale','private'),
    (v_hh_id,v_alice_id,'Linen bedsheet set','Fog Linen or similar natural-fibre quality',
     '',18000,'medium','wanted',0,'Home',
     'King size, off-white or natural linen','private'),
    (v_hh_id,v_alice_id,'Trail running shoes','Salomon Speedcross or Hoka Speedgoat',
     '',22000,'high','wanted',0,'Sport',
     'Size 38 — need to try in store first','private'),
    (v_hh_id,v_alice_id,'Breville Barista Express','Home espresso machine',
     '',75000,'high','saving',35000,'Kitchen',
     'For proper home espresso — Bob is on board too','household'),
    (v_hh_id,v_alice_id,'Japanese cooking class','Sushi + ramen workshop in Helsinki',
     '',9500,'medium','wanted',0,'Experience',
     'Could double as birthday gift idea','household'),
    (v_hh_id,v_alice_id,'AirPods Pro 2nd gen','Replace broken ones',
     '',32000,'high','saving',12000,'Electronics',
     'Watching for refurbished deal on Backmarket','private'),
    (v_hh_id,v_alice_id,'Fiddle leaf fig (large)','Statement plant for living room',
     '',8000,'low','wanted',0,'Home',
     'Check Panda Plants in Kallio','private'),
    (v_hh_id,v_alice_id,'Winsor & Newton watercolours','Professional 45-pan Cotman set',
     '',12000,'low','bought',12000,'Hobby',
     'Got this for birthday — love it!','private');

  -- ================================================================
  -- 12. Journal Entries (Alice — last 15 days)
  -- ================================================================

  INSERT INTO journal_entries
    (household_id, owner_id, entry_date, content, mood, tags)
  VALUES
    (v_hh_id,v_alice_id,CURRENT_DATE-14,
     'Productive day at work — shipped the new payment feature after 3 weeks of back-and-forth. Finally! Celebrated with Bob over sushi at Ichiban. The Greece planning is making me genuinely excited, I can''t wait to be there.',
     'great','work,travel,celebration'),
    (v_hh_id,v_alice_id,CURRENT_DATE-13,
     'Sunday yoga was everything. Slow vinyasa at Studio Verso, the instructor was really present. Spent the afternoon meal prepping — made a huge batch of lentil soup that should last until Wednesday.',
     'good','yoga,health,cooking'),
    (v_hh_id,v_alice_id,CURRENT_DATE-12,
     'Stressful Monday. Tense roadmap meeting with lots of misalignment on Q3 priorities. Came home drained. Made pasta carbonara which helped. Read Atomic Habits for an hour before bed.',
     'okay','work,stress,reading'),
    (v_hh_id,v_alice_id,CURRENT_DATE-11,
     'Morning farmers market at Hakaniemi — incredible strawberries and fresh basil. Spent the afternoon writing the blog post draft in a coffee shop. Good creative flow, got the intro and first section solid.',
     'good','creativity,writing,food'),
    (v_hh_id,v_alice_id,CURRENT_DATE-10,
     'Paid June rent today. Also booked the dentist for next week — been putting it off for months, finally done. Chloe texted about her graduation party and I''m looking forward to seeing everyone.',
     'okay','admin,health,social'),
    (v_hh_id,v_alice_id,CURRENT_DATE-9,
     'Solid day. Morning 8 km run along Töölönlahti. Work was a good focused sprint session. Evening call with mum who is doing really well. Early night.',
     'great','running,family,work'),
    (v_hh_id,v_alice_id,CURRENT_DATE-8,
     'Grocery haul + meal planned the whole week. Tried a new chicken shawarma recipe from a YouTube video — it was incredible. Definitely going into the regular rotation.',
     'good','cooking,food,routine'),
    (v_hh_id,v_alice_id,CURRENT_DATE-7,
     'A bit gloomy weather and mood-wise. Didn''t do much — watched a couple of episodes, ordered takeaway. That''s okay sometimes, rest is rest.',
     'okay','rest,self-care'),
    (v_hh_id,v_alice_id,CURRENT_DATE-6,
     'Chloe''s get-together was lovely. Saw people I hadn''t seen in months. Her apartment is beautiful — she''s really made it into a home. Came back energized and with lots of interior inspiration.',
     'great','social,friends,inspiration'),
    (v_hh_id,v_alice_id,CURRENT_DATE-5,
     'WFH day. Very productive — no meetings until 3 pm. Got a ton of PR reviews done. Also added Santorini restaurant picks to the shared Greece doc with Bob.',
     'good','work,travel,planning'),
    (v_hh_id,v_alice_id,CURRENT_DATE-4,
     'Dentist this morning — just a cleaning, all clear! Small win. Made chicken shawarma again by Bob''s request. Still incredible. Must write this recipe down properly.',
     'great','health,cooking,win'),
    (v_hh_id,v_alice_id,CURRENT_DATE-3,
     '10-minute Headspace session before bed helped me wind down. Read the last chapter of Atomic Habits — I really do need to start tracking things properly. Setting up habits in the app tomorrow.',
     'good','mindfulness,reading,habits'),
    (v_hh_id,v_alice_id,CURRENT_DATE-2,
     'Long day. Lidl + bakery run with Bob in the evening was unexpectedly fun. We bought fancy bread and cheese. Small moments that make the week worthwhile.',
     'good','routine,home,joy'),
    (v_hh_id,v_alice_id,CURRENT_DATE-1,
     'Finished the blog post draft! Rough but done — I''ll review and tighten it tomorrow. Also finalised the Athens hotel: booked a 4-star near the Acropolis. Greece feels real now.',
     'great','writing,travel,achievement'),
    (v_hh_id,v_alice_id,CURRENT_DATE,
     'Coffee run for the team — brought pastries too, went down well. Started performance review self-assessment. Need three concrete accomplishments by Thursday. Good list so far.',
     'good','work,team,routine');

  -- ================================================================
  -- 13. Notes
  -- ================================================================

  INSERT INTO notes
    (household_id, title, category, content, pinned,
     scope, visibility, created_by, owner_id, updated_by)
  VALUES
    (v_hh_id,'WiFi credentials','Home',
     E'Network: Home_5GHz\nPassword: (see password manager entry "Home WiFi")',
     true,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Emergency contacts','Safety',
     E'GP reception: 09-123-4567\nDentist (Haavikko): 09-987-6543\nPlumber Mikael: 040-111-2222\nElectrician Jukka: 040-777-8888\nAmbulance / fire / police: 112',
     true,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Landlord — Pekka Mäkinen','Home',
     E'Phone: 044-222-3333\nEmail: pekka@kiinteisto.fi\nMaintenance issues: email first; call only if no reply within 48 h.',
     false,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Building rules','Home',
     E'• Quiet hours: 22:00–07:00 weekdays, 00:00–08:00 weekends\n• Recycling room code: 4421\n• Laundry booking: Entri app (code in welcome email)\n• Sauna: Thursdays 18:00–22:00, book via Entri\n• Car park remote code: 7718',
     false,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Chicken shawarma recipe','Recipes',
     E'**Marinade (800 g chicken thighs)**\n- 2 tsp each: cumin, smoked paprika, turmeric, ground coriander\n- 1 tsp each: cinnamon, cardamom\n- 4 tbsp olive oil + juice of 1 lemon\n- 4 garlic cloves, crushed\n\nMarinate ≥4 h (overnight best). Cook 200 °C for 25 min.\nServe in flatbread with garlic yoghurt sauce + pickles.\n\n★★★★★ — Bob''s favourite',
     true,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Greece trip notes','Travel',
     E'Route: Athens (3 nights) → Santorini (5 nights) → Athens (2 nights)\n\n**Booked**\n- Flights: Finnair HEL → ATH direct ✓\n- Santorini: Eleon Studio, Fira ✓\n- Athens hotel: near Acropolis, 4★ ✓\n\n**Still to do**\n- Travel insurance\n- Acropolis timed entry (book online)\n- Volcano boat tour (book 2 weeks before)\n- Athens restaurant list\n\nBudget: €2 000 activities, €1 500 food, €800 local transport',
     false,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Monthly house meeting template','Home',
     E'**Agenda — every 1st of the month, 19:00**\n1. Finance review: expenses vs budget\n2. Task completion check-in\n3. Upcoming events coordination\n4. Maintenance issues / inventory restock\n5. Any other business\n\nNext: July 1',
     false,'household','household',v_alice_id,NULL,v_alice_id),

    (v_hh_id,'Work Q2 accomplishments','Work',
     E'1. Shipped payment flow redesign → 20% conversion uplift\n2. Led React migration of dashboard module (3 devs, 6 weeks)\n3. Mentored Vasilis + Iida through their first feature launches\n4. Reduced CI pipeline from 14 min → 6 min (GitHub Actions refactor)',
     false,'personal','private',v_alice_id,v_alice_id,v_alice_id),

    (v_hh_id,'Books to read','Personal',
     E'**Reading now:**\n- Atomic Habits — James Clear (almost done!)\n\n**Queue:**\n- The Creative Act — Rick Rubin\n- Four Thousand Weeks — Oliver Burkeman\n- Pachinko — Min Jin Lee\n- The Pragmatic Programmer (re-read)\n- Thinking in Systems — Donella Meadows',
     false,'personal','private',v_alice_id,v_alice_id,v_alice_id),

    (v_hh_id,'Landlord contact history','Admin',
     E'2026-04-15: Emailed re leaky tap. Replied same day, sent Mikael.\n2026-04-18: Tap fixed. Cost covered by landlord.\n2026-05-02: Annual inspection scheduled for June 30.\n2026-06-01: Sofa delivery — notified building manager for lift access.',
     false,'household','household',v_alice_id,NULL,v_alice_id);

  -- ================================================================
  -- 14. Contacts
  -- ================================================================

  INSERT INTO contacts
    (household_id, name, role, phone, email, company, address, category, note)
  VALUES
    (v_hh_id,'Pekka Mäkinen',      'Landlord',        '044-222-3333','pekka@kiinteisto.fi',  'Mäkinen Kiinteistöt','Mannerheimintie 45','Property',  'Contact for maintenance and rent queries'),
    (v_hh_id,'Dr Tuula Virtanen',  'GP',              '09-123-4567', 'reception@terveys.fi', 'Terveystalo',        'Ruoholahti clinic', 'Health',    'Book via app or call reception'),
    (v_hh_id,'Mikael Kettunen',    'Plumber',         '040-111-2222','',                      'Kettunen Plumbing',  'Helsinki',          'Trades',    'Fast response, good rate. Ask for weekday slots.'),
    (v_hh_id,'Liisa Häkkinen',     'Dentist',         '09-987-6543', 'liisa@hammas.fi',       'Haavikon Hammas',    'Kamppi, Helsinki',  'Health',    '6-monthly check-ups for the whole household'),
    (v_hh_id,'Ahmad Siddiqui',     'Accountant',      '050-333-4444','ahmad@veropalvelu.fi',  'Veropalvelu Oy',     'Pasila',            'Finance',   'Annual tax + freelance accounting'),
    (v_hh_id,'Taloyhtiö Hallitus', 'Building mgmt',   '',            'hallitus@talo.fi',      NULL,                 'Same building',     'Property',  'Annual meeting March. Chair: Matti.'),
    (v_hh_id,'Jukka Korhonen',     'Electrician',     '040-777-8888','',                      'JK Sähkö',           'Vantaa',            'Trades',    'Installed new office outlets, reliable work'),
    (v_hh_id,'Elena Mäkelä',       'Interior designer','045-555-6666','elena@interior.fi',    'Interior Helsinki',  NULL,                'Services',  'Consulted for living room redesign plan');

  -- ================================================================
  -- 15. Documents
  -- ================================================================

  INSERT INTO documents
    (household_id, title, doc_type, description, issuer,
     issue_date, expiry_date, reference_number, note)
  VALUES
    (v_hh_id,'Apartment Lease Agreement','lease',
     'Fixed 12-month lease for Kallio apartment',
     'Mäkinen Kiinteistöt Oy','2026-01-01','2026-12-31',
     'LEASE-2026-0441','PDF saved in shared Drive folder'),
    (v_hh_id,'Home Contents Insurance Policy','insurance',
     'All-risk contents cover, €50 000 limit',
     'If Vakuutus','2026-01-15','2027-01-14',
     'IF-442192-HCI','Annual premium €149, auto-renews January'),
    (v_hh_id,'IKEA Billy Bookshelf Warranty','warranty',
     'Two bookshelves, 10-year structural warranty',
     'IKEA',CURRENT_DATE-48,NULL,
     'IKEA-BILLY-2026-X2','Receipt scanned to Google Drive'),
    (v_hh_id,'MacBook Pro 2022 AppleCare+','warranty',
     '3-year AppleCare+ — EXPIRED. Note for replacement budget.',
     'Apple','2022-11-15','2025-11-14',
     'AC+-AAPL-22-MBP-7742','Expired — triggers MacBook fund urgency'),
    (v_hh_id,'Elisa Mobile Contract — Alice','contract',
     'Unlimited 5G plan, 24-month contract',
     'Elisa Oyj','2025-03-01','2027-02-28',
     'ELISA-MOB-2025-A441','ETF €120 if cancelled before Feb 2027'),
    (v_hh_id,'Car Annual Service Receipt','receipt',
     'Annual service + brake pads + tyre rotation',
     'AutoClinic Oy',CURRENT_DATE-5,NULL,
     'AC-RCP-20260608','Total €580. Next service due June 2027.');

  -- ================================================================
  -- 16. Boards + Board Items
  -- ================================================================

  INSERT INTO boards
    (household_id, owner_id, scope, name, description, color, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'household','Greece Trip 2026',
     'Everything for the summer holiday — tracking, booking, planning',
     '#9C27B0',0,v_alice_id)
  RETURNING id INTO v_board1;

  INSERT INTO boards
    (household_id, owner_id, scope, name, description, color, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'household','Home Improvements',
     'Things to fix, buy, upgrade, or redecorate',
     '#4CAF50',1,v_alice_id)
  RETURNING id INTO v_board2;

  INSERT INTO boards
    (household_id, owner_id, scope, name, description, color, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'personal','Alice — Work & Projects',
     'Work priorities, side projects, learning',
     '#3F51B5',2,v_alice_id)
  RETURNING id INTO v_board3;

  -- Greece board
  INSERT INTO board_items
    (board_id, household_id, name, notes, group_name, is_checked, position, updated_by)
  VALUES
    (v_board1,v_hh_id,'Research Athens vs Santorini routing',    'Train options too',                  'Research', true, 0,v_alice_id),
    (v_board1,v_hh_id,'Compare flight prices',                   'Finnair direct or Ryanair via Milan','Research', true, 1,v_alice_id),
    (v_board1,v_hh_id,'Book flights HEL → ATH',                 'Finnair deal found — booked!',       'Booking',  true, 0,v_alice_id),
    (v_board1,v_hh_id,'Book Santorini Airbnb',                   'Eleon Studio, Fira — confirmed',     'Booking',  true, 1,v_alice_id),
    (v_board1,v_hh_id,'Book Athens hotel',                       '4★ near Acropolis — booked',         'Booking',  true, 2,v_alice_id),
    (v_board1,v_hh_id,'Apply for travel insurance',              'If Vakuutus multi-trip plan',        'Admin',    false,0,v_alice_id),
    (v_board1,v_hh_id,'Notify landlord of absence',              '10-day notice required',             'Admin',    false,1,v_alice_id),
    (v_board1,v_hh_id,'Book Acropolis timed entry',              'Sells out weeks ahead',              'Activities',false,0,v_alice_id),
    (v_board1,v_hh_id,'Book volcano boat tour',                  'Very popular — book early',          'Activities',false,1,v_alice_id),
    (v_board1,v_hh_id,'Research best Athens restaurants',        'Taverna vs modern Greek cuisine',    'Activities',false,2,v_alice_id),
    (v_board1,v_hh_id,'Create shared packing list',              NULL,                                 'Prep',     false,0,v_alice_id),
    -- Home improvements board
    (v_board2,v_hh_id,'New bathroom mirror — round 80 cm backlit', NULL,                              'Bathroom', false,0,v_alice_id),
    (v_board2,v_hh_id,'Repaint hallway light grey',              'Tikkurila Harmony 5',               'Painting', false,0,v_alice_id),
    (v_board2,v_hh_id,'Smart plug for coffee machine',           'Schedule auto-brew at 7 am',        'Smart home',false,0,v_alice_id),
    (v_board2,v_hh_id,'Replace kitchen tap (drips slightly)',    'Get Mikael to quote',               'Kitchen',  false,0,v_alice_id),
    (v_board2,v_hh_id,'Install blackout curtains — bedroom',     NULL,                                'Bedroom',  true, 0,v_alice_id),
    (v_board2,v_hh_id,'New entrance coir mat',                   'Non-slip, natural fibre',           'Entrance', true, 0,v_alice_id),
    (v_board2,v_hh_id,'Add more plants to living room',          'Fiddle leaf fig or monstera',       'Decor',    false,0,v_alice_id),
    -- Alice work board (personal)
    (v_board3,v_hh_id,'Performance review self-assessment',      'Due Thursday — 3 accomplishments',  'This week',false,0,v_alice_id),
    (v_board3,v_hh_id,'Code review: auth module PR',             'Vasilis waiting — high priority',   'This week',false,1,v_alice_id),
    (v_board3,v_hh_id,'Q3 feature breakdown presentation',       'Present to team July 7',            'Planning', false,0,v_alice_id),
    (v_board3,v_hh_id,'Blog post: Supabase vs Firebase 2026',    '70% draft done — needs polish',     'Writing',  false,0,v_alice_id),
    (v_board3,v_hh_id,'Set up E2E tests in GitHub Actions',      'CI improvement task',               'Dev work', false,0,v_alice_id),
    (v_board3,v_hh_id,'Finish React Suspense module on Udemy',   NULL,                                'Learning', false,0,v_alice_id),
    (v_board3,v_hh_id,'Apply for senior engineer promotion',     'Ask manager for timeline',          'Career',   false,0,v_alice_id);

  -- ================================================================
  -- 17. Trackers + Entries (Alice personal)
  -- ================================================================

  INSERT INTO trackers
    (household_id, owner_id, scope, name, description, icon, color,
     value_type, unit, target_value, target_direction, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'personal','Daily steps',
     'Step count from phone Health app','🚶','#EF5350',
     'numeric','steps',10000,'increase',0,v_alice_id)
  RETURNING id INTO v_tracker1;

  INSERT INTO trackers
    (household_id, owner_id, scope, name, description, icon, color,
     value_type, unit, target_value, target_direction, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'personal','Sleep duration',
     'Hours slept each night','😴','#5C6BC0',
     'numeric','hours',8,'maintain',1,v_alice_id)
  RETURNING id INTO v_tracker2;

  INSERT INTO trackers
    (household_id, owner_id, scope, name, description, icon, color,
     value_type, unit, target_value, target_direction, position, updated_by)
  VALUES
    (v_hh_id,v_alice_id,'personal','Morning run distance',
     'Kilometres run in morning session','🏃','#26A69A',
     'numeric','km',5,'increase',2,v_alice_id)
  RETURNING id INTO v_tracker3;

  -- Tracker entries — last 21 days with realistic variation
  FOR d IN
    SELECT generate_series(CURRENT_DATE - 20, CURRENT_DATE, interval '1 day')::date
  LOOP
    -- Steps: 6 000–13 000 range
    INSERT INTO tracker_entries
      (household_id, tracker_id, entry_date, numeric_value, updated_by)
    VALUES
      (v_hh_id, v_tracker1, d,
       6000 + ((EXTRACT(DAY FROM d)::int * 317 + EXTRACT(DOW FROM d)::int * 1103) % 7200),
       v_alice_id)
    ON CONFLICT DO NOTHING;

    -- Sleep: 6.0–8.5 hours
    INSERT INTO tracker_entries
      (household_id, tracker_id, entry_date, numeric_value, updated_by)
    VALUES
      (v_hh_id, v_tracker2, d,
       ROUND((6.5 + (EXTRACT(DAY FROM d)::int * 0.17 + EXTRACT(DOW FROM d)::int * 0.11) % 2.2)::numeric, 1),
       v_alice_id)
    ON CONFLICT DO NOTHING;

    -- Run: only on weekdays when she didn't skip
    IF EXTRACT(DOW FROM d) BETWEEN 1 AND 5
       AND EXTRACT(DAY FROM d)::int % 10 NOT IN (3, 7)
    THEN
      INSERT INTO tracker_entries
        (household_id, tracker_id, entry_date, numeric_value, notes, updated_by)
      VALUES
        (v_hh_id, v_tracker3, d,
         ROUND((5.0 + (EXTRACT(DAY FROM d)::int * 0.31) % 4.0)::numeric, 1),
         CASE WHEN EXTRACT(DAY FROM d)::int % 5 = 0 THEN 'Felt strong, PB pace' ELSE '' END,
         v_alice_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- ================================================================
  -- 18. Reminders
  -- ================================================================

  INSERT INTO reminders
    (household_id, title, type, due_date, assigned_to, status, note, updated_by)
  VALUES
    (v_hh_id,'Pay electricity bill (Helen)','finance',        CURRENT_DATE+2,  v_alice_id,'active','~€78, auto-pay should trigger',          v_alice_id),
    (v_hh_id,'Book dentist — Bob',          'health',         CURRENT_DATE+5,  v_bob_id,  'active','Remind Bob to actually book this time',   v_alice_id),
    (v_hh_id,'Buy travel insurance',        'travel',         CURRENT_DATE+50, v_alice_id,'active','If Vakuutus multi-trip plan',             v_alice_id),
    (v_hh_id,'Car tyre pressure before road trip','car',      CURRENT_DATE+10, v_bob_id,  'active','Check all 4 tyres at any petrol station', v_alice_id),
    (v_hh_id,'Renew lease — start talks',   'admin',          CURRENT_DATE+170,v_alice_id,'active','Lease ends Dec 31, approach Pekka in Oct',v_alice_id),
    (v_hh_id,'Summer wardrobe switchover',  'home',           CURRENT_DATE+7,  v_alice_id,'active','Pack away winter items into storage bags', v_alice_id),
    (v_hh_id,'Chloe graduation gift',       'social',         CURRENT_DATE+12, v_alice_id,'active','Budget €50–80, something personal',       v_alice_id),
    (v_hh_id,'Submit Q2 tax estimate',      'finance',        CURRENT_DATE-20, v_alice_id,'done', 'Submitted to Ahmad on time, confirmed',    v_alice_id),
    (v_hh_id,'Fix dripping bathroom tap',   'maintenance',    CURRENT_DATE-55, v_bob_id,  'done', 'Mikael fixed it April 18 — all clear',     v_alice_id);

  -- ================================================================
  -- 19. Settings
  -- ================================================================

  INSERT INTO settings (household_id, key, value)
  VALUES
    (v_hh_id,'currency',            'EUR'),
    (v_hh_id,'locale',              'fi-FI'),
    (v_hh_id,'first_day_of_week',   '1'),
    (v_hh_id,'budget_reset_day',    '1'),
    (v_hh_id,'theme',               'auto')
  ON CONFLICT (household_id, key) DO UPDATE SET value = EXCLUDED.value;

  -- ================================================================
  -- 20. Activity Log — recent audit trail
  -- ================================================================

  INSERT INTO activity_log
    (household_id, timestamp, actor_id, entity_type, entity_id, operation, summary)
  VALUES
    (v_hh_id, now()-interval'1 hour',   v_alice_id,'expense',      gen_random_uuid(),'create','Added expense: Work coffee run — €25.80'),
    (v_hh_id, now()-interval'3 hours',  v_alice_id,'journal',      gen_random_uuid(),'create','Journal entry for today'),
    (v_hh_id, now()-interval'1 day',    v_alice_id,'grocery',      gen_random_uuid(),'update','Marked groceries as bought after shop'),
    (v_hh_id, now()-interval'2 days',   v_alice_id,'task',         gen_random_uuid(),'update','Completed task: dentist appointment booked'),
    (v_hh_id, now()-interval'2 days',   v_alice_id,'board',        gen_random_uuid(),'update','Greece board: marked Athens hotel as done'),
    (v_hh_id, now()-interval'3 days',   v_bob_id,  'expense',      gen_random_uuid(),'create','Added expense: Lidl + bakery — €74.20'),
    (v_hh_id, now()-interval'5 days',   v_alice_id,'savings_goal', gen_random_uuid(),'update','Added €500 contribution to Emergency Fund'),
    (v_hh_id, now()-interval'6 days',   v_alice_id,'note',         gen_random_uuid(),'create','Added note: chicken shawarma recipe'),
    (v_hh_id, now()-interval'8 days',   v_alice_id,'tracker',      gen_random_uuid(),'create','New tracker: daily steps'),
    (v_hh_id, now()-interval'10 days',  v_alice_id,'bill',         gen_random_uuid(),'update','Marked June rent as paid — €1 800'),
    (v_hh_id, now()-interval'12 days',  v_chloe_id,'grocery',      gen_random_uuid(),'create','Added cherry tomatoes to grocery list'),
    (v_hh_id, now()-interval'14 days',  v_alice_id,'expense',      gen_random_uuid(),'create','Added June rent expense — €1 800'),
    (v_hh_id, now()-interval'16 days',  v_alice_id,'task',         gen_random_uuid(),'update','Marked task done: submit Q2 tax estimate'),
    (v_hh_id, now()-interval'18 days',  v_bob_id,  'task',         gen_random_uuid(),'update','Started task: organise linen closet'),
    (v_hh_id, now()-interval'20 days',  v_alice_id,'wishlist',     gen_random_uuid(),'create','Added wishlist item: Breville Barista Express');

END $$;
