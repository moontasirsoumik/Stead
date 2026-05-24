# Trackers Feature — Implementation Plan

> **Phase:** P36 — Dynamic Trackers  
> **Status:** In Progress  
> **Started:** 2026-05-21

---

## Overview

A general-purpose "Trackers" module that lets users define custom trackers (period, weight, savings, habits, anything) with typed data entries and provides rich analytics: trends, cycle prediction, cross-tracker correlations, and anomaly detection.

- **Scope:** Dual (household + personal)
- **Entry mode:** Manual only (no automated reminders)
- **Analytics:** Client-side computed (works offline from Dexie cache)
- **Charts:** Hand-rolled SVG sparklines (list) + Chart.js (detail page)

---

## Phase 1 — Data Layer

### Step 1.1: Database Migration (`017_trackers.sql`)

**Tables:**
- `trackers` — definition of what to track
- `tracker_entries` — individual time-series data points

**Key columns (trackers):**
- `value_type`: `'numeric' | 'boolean' | 'category' | 'duration' | 'counter'`
- `unit`, `categories` (JSON array string), `target_value`, `target_direction`
- `is_cyclic` — enables cycle analytics
- Dual-scope: `scope` + `owner_id`

**Key columns (tracker_entries):**
- `tracker_id` FK, `entry_date` DATE
- `numeric_value`, `text_value`, `boolean_value` — polymorphic value storage
- `notes`, `tags` (comma-separated)

**RLS:** Dual-scope policies matching the pattern from migrations 007/008.

**Status:** ⬜ Not started

---

### Step 1.2: TypeScript Models

**Files:**
- `src/models/tracker.model.ts` — `Tracker` and `TrackerEntry` interfaces
- `src/models/enums.ts` — add `TrackerValueType`, `TargetDirection` string unions

**Status:** ⬜ Not started

---

### Step 1.3: Zod Schemas

**File:** `src/schemas/tracker.schema.ts`

**Status:** ⬜ Not started

---

### Step 1.4: Dexie Cache Update

**File:** `src/services/cache/db.ts` — version 9, add `trackers` + `tracker_entries` tables with indexes on `tracker_id`, `entry_date`, `scope`, `owner_id`

**Status:** ⬜ Not started

---

### Step 1.5: Data Services

**File:** `src/services/data/tracker.data.ts` — two `BaseDataService` instances

**Status:** ⬜ Not started

---

### Step 1.6: Pinia Store

**File:** `src/stores/tracker.store.ts` — CRUD for both trackers and entries, scoped filtering

**Status:** ⬜ Not started

---

## Phase 2 — Analytics Engine

### Step 2.1: Basic Analytics Composable

**File:** `src/features/trackers/composables/useTrackerAnalytics.ts`

**Computes:**
- Count, average, min, max, sum (numeric types)
- Current streak + longest streak (boolean/counter)
- Last value + change from previous
- Linear regression slope → trend direction (up/down/flat)
- 7-day and 30-day moving averages
- Goal progress % (current vs target_value)
- Rate of change (velocity per week)

**Status:** ⬜ Not started

---

### Step 2.2: Cycle Detection Composable

**File:** `src/features/trackers/composables/useTrackerCycles.ts`

**Computes:**
- Intervals between entries (or between "start" markers via tags)
- Median cycle length + standard deviation
- Next predicted occurrence + confidence window (±σ days)

**Status:** ⬜ Not started

---

### Step 2.3: Correlations & Anomaly Composable

**File:** `src/features/trackers/composables/useTrackerCorrelations.ts`

**Computes:**
- Pearson correlation coefficient between any two numeric trackers
- Day-of-week distribution analysis (bar chart data)
- Anomaly detection: entries with z-score > 2σ from rolling mean

**Status:** ⬜ Not started

---

## Phase 3 — List Page UI

### Step 3.1: Trackers Page

**File:** `src/features/trackers/TrackersPage.vue`
- Grid of tracker cards (2-col desktop, 1-col mobile)
- Scope-aware filtering (uses appStore.scope)
- Search + "New Tracker" button

**Status:** ⬜ Not started

---

### Step 3.2: Tracker Card Component

**File:** `src/features/trackers/components/TrackerCard.vue`
- Icon + color accent strip
- Name, latest value, unit
- Mini SVG sparkline (last 14 entries)
- Trend indicator (arrow + color)
- Quick-log button

**Status:** ⬜ Not started

---

### Step 3.3: Sparkline SVG Component

**File:** `src/features/trackers/components/SparklineSvg.vue`
- Reusable SVG polyline sparkline
- Props: data points array, width, height, color
- Responsive, animates on mount

**Status:** ⬜ Not started

---

### Step 3.4: Tracker Form Drawer

**File:** `src/features/trackers/components/TrackerFormDrawer.vue`
- Create/edit tracker
- Dynamic form: value type selector changes available fields
- Category builder (add/remove chips)
- Target value + direction (optional section)
- Cyclic toggle

**Status:** ⬜ Not started

---

### Step 3.5: Router + Navigation

**Files:**
- `src/router/index.ts` — add `/trackers` and `/trackers/:id` routes
- Sidebar/NavRail — add "Trackers" nav item with icon

**Status:** ⬜ Not started

---

## Phase 4 — Detail Page

### Step 4.1: Tracker Detail Page

**File:** `src/features/trackers/TrackerDetailPage.vue`
- Header: tracker info + edit button
- Stats row: current value | average | trend | streak/goal
- Entry log table
- Chart section (expandable)
- Analytics panel (expandable)

**Status:** ⬜ Not started

---

### Step 4.2: Entry Log Table

**File:** `src/features/trackers/components/EntryLogTable.vue`
- Grid-table pattern (existing codebase style)
- Columns: date, value (formatted by type), notes, tags
- Inline add-entry row at top
- Edit/delete per row

**Status:** ⬜ Not started

---

### Step 4.3: Entry Form Drawer

**File:** `src/features/trackers/components/EntryFormDrawer.vue`
- Date picker (defaults today)
- Dynamic value input based on value_type:
  - numeric → number input + unit label
  - boolean → toggle switch
  - category → chip selector from tracker.categories
  - duration → hours:minutes inputs
  - counter → stepper (+/- buttons)
- Notes textarea + tags input

**Status:** ⬜ Not started

---

### Step 4.4: Chart Component

**File:** `src/features/trackers/components/TrackerChart.vue`
- Line chart (numeric/duration/counter)
- Calendar heatmap (boolean/category) — optional
- Timeframe selector: 7d / 30d / 90d / All
- Moving average overlay toggle
- Uses Chart.js + vue-chartjs

**Status:** ⬜ Not started

---

### Step 4.5: Analytics Panel

**File:** `src/features/trackers/components/AnalyticsPanel.vue`
- Cycle prediction card (if is_cyclic): "Next expected: [date] (±N days)"
- Correlations section: select tracker, show Pearson r value + interpretation
- Anomalies list: flagged entries with deviation info
- Day-of-week breakdown visualization

**Status:** ⬜ Not started

---

## Phase 5 — Polish & Integration

### Step 5.1: Install Chart.js

**Command:** `bun add chart.js vue-chartjs`

**Status:** ⬜ Not started

---

### Step 5.2: Verify Build

- `bun run type-check` passes
- `bun run build` produces no errors

**Status:** ⬜ Not started

---

## Verification Checklist

- [ ] Type-check passes with all new files
- [ ] Build produces no errors
- [ ] Create numeric tracker → log entries → sparkline renders
- [ ] Create boolean tracker → streak calculation works
- [ ] Create category tracker with is_cyclic → cycle prediction after entries
- [ ] Correlation panel shows meaningful values between two numeric trackers
- [ ] Anomaly detection highlights outlier entries
- [ ] Dual-scope works (personal hidden from household view)
- [ ] RLS policies block cross-household access

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Manual entry only | User confirmed — simplifies UX, no notification system needed |
| Client-side analytics | Local-first principle — works offline from Dexie cache |
| Tags for metadata | Avoids extra tables — period symptoms stored as comma-separated tags |
| `is_cyclic` opt-in | Prevents false pattern detection on non-cyclic data |
| Multiple entries/day allowed | Supports AM/PM readings — analytics aggregate by date |
| Chart.js for full charts | Tree-shakeable, well-maintained, Vue wrapper available |
| Hand-rolled SVG sparklines | Zero-dependency, fast render on list page cards |
| Polymorphic value columns | One entry table serves all value types — simpler than separate tables |
