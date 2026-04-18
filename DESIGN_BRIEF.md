# Drishti Nepal — Design Brief

### For Stitch / Figma

---

## 1. Product Concept

**Drishti Nepal (दृष्टि नेपाल)** is a civic accountability dashboard for Nepal. It tracks the Rastriya Swatantra Party–led coalition government against its two published manifestos:

- **Vacha Patra (वाचा पत्र / Bachha Patra)** — 100 specific, numbered commitments (bp-001 to bp-100)
- **Karar Patra (करार पत्र / Karar Patra)** — 5 priority areas, each with a % weight toward the government's overall score

The platform is **non-partisan and data-driven**. Every score, progress bar, and status badge is backed by a cited data source (government gazette, official statistics, cabinet decisions). There is no editorial spin — only numbers and evidence.

**Government formation date:** 27 March 2026. Every page can show "Day N of this government."

---

## 2. Audience

- Nepali citizens (urban, educated, both English and Nepali speakers)
- Journalists and researchers
- Policy community
- Diaspora Nepalis abroad following national politics

---

## 3. Design Principles

1. **Trust through transparency** — Every claim links to a source. Numbers must be readable at a glance.
2. **Bilingual by default** — English and Nepali (Devanagari, `ne-NP`) carry equal weight. All labels, numbers, and navigation appear in both. Language toggle is always accessible.
3. **Mobile-first** — The majority of Nepali internet users are on phones. All layouts should work at 375px first.
4. **Data-dense but not cluttered** — Show the number. Let the user drill in. Progressive disclosure over wall-of-text.
5. **Institutional gravity** — This is not a news site or social media. It should feel like a serious civic tool — neutral palette, clean typography, trustworthy.
6. **What we will never do** — No advertising. No party branding. No clickbait headlines. No political commentary.

---

## 4. Colour System

### Brand Palette

| Role         | Hex       | Usage                                         |
| ------------ | --------- | --------------------------------------------- |
| Primary Blue | `#1d4ed8` | Default accent, links, score bars, hero label |
| Neutral Dark | `#171717` | Hero background start                         |
| Neutral Mid  | `#262626` | Hero background end                           |
| Neutral 800  | `#262626` | Body headings                                 |
| Neutral 500  | `#737373` | Secondary text                                |
| Neutral 200  | `#e5e5e5` | Card borders                                  |
| Neutral 100  | `#f5f5f5` | Progress bar background                       |

### Priority Area Colours (5 fixed brand colours)

| Area ID | Name                        | Colour                  |
| ------- | --------------------------- | ----------------------- |
| PP-001  | Integrity & Good Governance | `#1d4ed8` (Blue)        |
| PP-002  | Prosperous Middle-Class     | `#0f6b3b` (Green)       |
| PP-003  | Jobs & Opportunity          | `#92400e` (Amber/Brown) |
| PP-004  | Connected Nepal             | `#5b21b6` (Purple)      |
| PP-005  | Diaspora & Global Nepal     | `#b91c1c` (Red)         |

Each area also has a `colorLight` tint (e.g., `#eef2f7`) used for card backgrounds when active.

### Process Status Colours (5 statuses)

| Status                   | Colour treatment   |
| ------------------------ | ------------------ |
| `not_started`            | Neutral grey chip  |
| `ongoing`                | Blue chip          |
| `resolved` / `fulfilled` | Emerald green chip |
| `blocked`                | Amber/orange chip  |
| `reversed`               | Red chip           |

### Score Badge Colours (0–100)

| Range  | Colour        |
| ------ | ------------- |
| 0–39   | Red           |
| 40–59  | Amber         |
| 60–79  | Blue          |
| 80–100 | Emerald green |

---

## 5. Typography

- **Primary typeface:** System sans-serif stack (Inter or Geist preferred)
- **Nepali (Devanagari):** Noto Sans Devanagari or Tiro Devanabari — a separate `font-nepali` class
- **Score numbers:** Extra-bold (`font-extrabold`), tabular numerals (`tabular-nums`)
- **Labels / tags:** All-caps, wide letter-spacing (`tracking-widest`), `text-xs`
- **Hierarchy:** H1 `text-3xl font-bold` → H2 `text-xl font-bold` → Body `text-sm` → Label `text-xs`

---

## 6. Screen Inventory

### Screen 1: Homepage

**Purpose:** First impression. Government performance at a glance.

**Layout (top to bottom):**

#### A. National Score Hero (dark section, full-width)

- Background: dark gradient (`neutral-900` → `neutral-800` → `neutral-900`) with a subtle white grid overlay (3% opacity)
- Top label (small caps, blue): "Government Performance Score" / "सरकारको कार्यसम्पादन स्कोर"
- **Score number**: massive (7xl–8xl), white, bold, tabular — e.g. `47/100`
- **Trend line**: `↑ +3 from last month` in emerald green, or `↓ -2` in red, or neutral `→` if flat
- **Meta strip** below score (small, neutral-400):
  - "Based on **N** result indicators"
  - "Day **N** of government"
  - "Methodology →" (link)

#### B. 5 Priority Area Score Cards (grid, 5 columns on desktop, 2-col on tablet, 1-col on mobile)

- Each card shows:
  - Coloured top bar (area colour, ~6px thick)
  - Area ID badge (e.g. `PP-001`) in the area colour
  - Area name in English + Nepali
  - Score `%` (bold, area colour)
  - Thin progress bar (area colour)
  - "N fulfilled · N in progress" footnote
  - Active card: border highlighted in area colour

#### C. Ministry Performance (two rows)

- Section header: "Top Performers" / "Best Performing Ministries"
- 3 top-scoring ministries: minister photo + name + score badge (green)
- Section header: "Needs Attention"
- 3 bottom-scoring ministries: minister photo + name + score badge (red/amber)
- Each row item is clickable → minister detail page

#### D. Latest Articles (3 cards)

- Section title: "Recent Analysis"
- Each card: category tag + headline + date
- "View all articles →" link

#### E. CTA Section

- Brief 2-sentence platform explanation
- "Track 100 Commitments →" button → manifesto page

---

### Screen 2: Ministers List

**URL:** `/ministers`

**Layout:**

- Page title: "Cabinet Ministers" / "मन्त्रिपरिषद सदस्यहरू"
- Subtitle: "N ministers · Day N of this government"
- Grid of minister cards (3–4 col desktop, 2 col tablet, 1 col mobile):
  - Minister headshot (circular or square-rounded)
  - Name EN + Name NP
  - Ministry name
  - Party name
  - Score badge (coloured by score range)

---

### Screen 3: Minister Detail Page

**URL:** `/ministers/[id]`

**Layout (top to bottom):**

#### A. Header

- Minister photo (large, left-aligned or centered on mobile)
- Name (bold, large)
- Ministry name (secondary)
- Party name + appointment date
- Score badge (prominent, colour = score range)

#### B. Score Trend Chart

- Title: "Score History" / "स्कोर इतिहास"
- Line chart, 90 days, 0–100 Y-axis
- Two lines:
  - **Overall score** — solid blue line (`#1d4ed8`), thickness 2.5
  - **Outcome score** — dashed green line (`#10b981`), lighter
- Subtle grid lines, clean axis labels, tooltip on hover
- Chart height: ~260px

#### C. Result Indicators List

- Section heading: "Performance Indicators" / "कार्यसम्पादन सूचकहरू"
- Each indicator is a card (white, rounded, border):
  - **Header row**: indicator label (bold) + progress `%` (blue, bold right-aligned)
  - **Source name** (small, grey, below label)
  - **Progress bar**: thin (6px), blue, smooth
  - **Metric row** (small, grey): Baseline `X` · Current `Y` · Target `Z` · Unit
  - **"N process steps ▸"** button (blue link) — expands to show nested process indicators

#### D. Nested Process Indicators (expandable)

- Appears inside the result indicator card, below a thin divider
- Light grey background section
- Each process indicator row:
  - Status chip (coloured: `not_started` / `ongoing` / `resolved` / `blocked` / `reversed`)
  - Process step name / indicator label
- No progress bar — process indicators have status only, not a score

---

### Screen 4: Manifesto / Vacha Patra Tracker

**URL:** `/manifesto`

**Layout:**

#### A. Page Header

- Title: "Vacha Patra Tracker" / "वाचा पत्र ट्र्याकर"
- Subtitle: "100 commitments tracked against real government actions and outcome data."

#### B. Summary Stats Strip (4 cards)

- **Total**: 100
- **Fulfilled** (emerald): count
- **In Progress** (blue): count
- **Not Started** (grey): count

#### C. Overall Progress Bar

- Label: "Overall Progress" + `%` right-aligned
- Segmented bar: emerald segment (fulfilled) + blue segment (in-progress) on neutral background
- Height: ~10px

#### D. ManifestoExplorer — 5 Priority Area Tab Grid

- **Area Cards** (5, clickable tabs — 5 col desktop, 2-col tablet, scroll on mobile):
  - Coloured top bar (6px, area colour)
  - Area ID badge (coloured)
  - Area name EN (coloured bold)
  - Area name NP (grey, smaller)
  - Progress `%` (bold, area colour)
  - Thin progress bar
  - "N fulfilled · N in progress" footnote
  - **Active state**: border = area colour

- **Below tabs: commitment list for selected area**
  - Area name as section heading (coloured)
  - Each commitment row (`ManifestoItemRow`):
    - Commitment ID (bp-XXX)
    - Commitment title (EN + NP)
    - Status chip
    - Progress `%` (if result indicators exist)
    - Clickable → commitment detail page

---

### Screen 5: Commitment Detail Page

**URL:** `/manifesto/[slug]` (e.g. `/manifesto/bp-042`)

**Layout:**

#### A. Breadcrumb

`Manifesto → [Area Name] → bp-042`

#### B. Header

- Area colour badge (PP-002 style)
- Commitment ID: `bp-042`
- Commitment title (EN, large bold)
- Commitment text (NP, secondary)
- Assigned ministers (linked badges → minister pages)
- **Aggregate Score badge** (calculated from result indicators only; show "No measurable data yet" if none)

#### C. Indicators (same `IndicatorList` component as minister page)

- Result indicators with progress bars
- Nested process steps (expandable)

#### D. Linked Government Actions

- Section: "Government Actions" / "सरकारी कार्यहरू"
- List of up to 10 action items: title + date + category + sentiment tag (positive/neutral/negative)

#### E. Cabinet Decisions

- Section: "Cabinet Decisions" / "मन्त्रिपरिषद निर्णयहरू"
- List of up to 10 decisions: title + date + significance tag

#### F. Related Articles

- Section: "Related Articles"
- Up to 5 article cards: title + date + category

---

### Screen 6: Articles / Analysis

**URL:** `/articles`

**Layout:**

- Article index: card grid (title, excerpt, date, category tag)
- Article detail: full-width reading layout, markdown-rendered, estimated read time

---

### Screen 7: Methodology Page

**URL:** `/methodology`

**Content:**

- How the 0–100 score is calculated
- Difference between result indicators (count toward score) vs process indicators (status-only, not scored)
- How source citations work
- Weighting by Karar Patra priority area
- Update frequency

---

### Screen 8: Admin Panel (not public-facing)

**URL:** `/admin`

For editorial team only. Access control via Supabase auth.

- List of all outcome indicators with filter by type (result / process) and process status
- Edit indicator values (baseline, current, target, deadline)
- Edit process status (5 states)
- Assign indicators to manifesto items and ministers
- Link actions and cabinet decisions to commitments

---

## 7. Key UI Component Specifications

### Score Badge

```
[ 72 ]
```

- Rounded pill or square-rounded
- Background: score-range colour (red/amber/blue/green)
- Text: white, bold, tabular-nums
- Sizes: `sm` (in list rows) and `lg` (in minister header)

### Progress Bar

- Height: 6px (thin) or 10px (overall progress)
- Radius: fully rounded
- Background: `neutral-100`
- Fill: area colour or blue
- Segmented version (manifesto overall): two fills side-by-side (fulfilled = emerald, in-progress = blue)

### Process Status Chip

Small pill with coloured background:
| Status | Label EN | Label NP | Colour |
|---|---|---|---|
| not_started | Not Started | सुरु नभएको | Grey |
| ongoing | In Progress | प्रगतिमा | Blue |
| resolved | Completed | सम्पन्न | Emerald |
| blocked | Blocked | अवरुद्ध | Amber |
| reversed | Reversed | उल्टाइएको | Red |

### Area ID Badge

- Small, coloured background (area colour), white text
- Format: `PP-001`, `PP-002`, etc.
- Used in: area cards, breadcrumbs, commitment detail headers

### Score History Line Chart

- Recharts `LineChart`
- 0–100 Y-axis, date labels on X-axis
- 2 lines: solid blue (overall), dashed green (outcomes)
- Clean: no border, minimal grid, tooltip on hover

### Manifesto Item Row

- Horizontal list row with:
  - Left: `bp-XXX` chip
  - Middle: commitment title (EN bold + NP small)
  - Right: status chip + progress `%`
  - Full row is a link

---

## 8. Data Points Reference

### National Level

- `score` — weighted average of all result indicators, 0–100
- `trend` — score change vs previous monthly snapshot (positive = ↑, negative = ↓)
- `daysSinceFormation` — calendar days since 27 March 2026
- `indicatorCount` — total result indicators used in score

### Per Priority Area (5 areas)

- `areaScore` — weighted average of result indicators in that area
- `fulfilled` count, `inProgress` count, `total` commitment count
- `areaPct` — `(fulfilled + inProgress * 0.5) / total * 100`

### Per Minister (17 ministers)

- `score` — weighted average of assigned result indicators, 0–100
- `score_history` — array of `{date, overall, outcome_score}` for 90-day chart
- `indicators` — list of result indicators (with nested process indicators)

### Per Commitment (100 bp items)

- `source_id` — `bp-001` to `bp-100`
- `title_en`, `title_np`, `item_text_en`, `item_text_np`
- `aggregateScore` — computed from result indicators assigned to this commitment
- `assigned_ministers` — array of minister references
- `indicators` — result + process indicators

### Per Indicator

- `indicator_type`: `"result"` | `"process"`
- `baseline_value`, `current_value`, `target_value`, `unit`
- `direction`: `"higher_is_better"` | `"lower_is_better"`
- `target_deadline`
- `process_status` (process indicators only): one of 5 statuses above
- `sources.name_en` — citation

---

## 9. Navigation

```
[Logo: Drishti Nepal | दृष्टि नेपाल]

Primary Nav:
  Home | Ministers | Manifesto | Articles | Decisions | About

Secondary / Utility:
  [ EN | NP ] language toggle
  [ Search ]
  [ Admin ] (authenticated only)
```

Mobile: hamburger menu collapses primary nav.

---

## 10. Priority Features for V1 Design

Ranked by importance:

1. **National Score Hero** — The homepage must open with a dramatic, clear score. This is the single most important screen. Dark background, giant number, trend arrow.

2. **Minister Scorecard** — Photo + name + score badge + clean score history line chart + indicator list. This is the "product page" for each politician.

3. **100 Commitments Tracker** — Tab-navigation through 5 priority areas. Each commitment at a glance (status chip + progress %). Filtering by area. Clean, scannable rows.

4. **Indicator Drill-Down** — Within any minister or commitment view: expandable result indicators with baseline → current → target progression. Nested process steps inside each result indicator.

5. **Bilingual Toggle** — Language switch must be instant and persistent. All text content has EN + NP equivalents. Numbers stay the same.

6. **Mobile Layout** — Homepage hero → scrollable area cards → top/bottom ministries. All works without horizontal scroll at 375px.

7. **Source Citations** — Every indicator shows its source name. Every data point is traceable. This is non-negotiable for trust.

---

## 11. What This Product Is NOT

- Not a news outlet (no opinion pieces, no editorials)
- Not affiliated with any political party
- Not crowdfunded or ad-supported
- Not a social platform (no comments, no shares, no reactions)
- Not a predictions market
- Not static — data is updated on a cycle (daily scraping, monthly score snapshots)

---

## 12. Voice and Tone

- **Formal but accessible** — like a good government report redesigned for the web
- **Neutral** — "The score is 47/100" not "The government is failing"
- **Precise** — cite the number, cite the source, cite the date
- **Bilingual and equal** — neither English nor Nepali is the "translation"
