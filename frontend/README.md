# FRISA — Fridge's Smart Assistant

A high-fidelity, mobile-first web prototype of **FRISA**, an AIoT food-intelligence
assistant that helps households know what they have, use it at the right time and
waste less. Built for a business plan competition (SDG 12 — Responsible Consumption
and Production).

> **Know Your Food. Waste Less.**

Everything in this prototype runs locally in the browser. There is no backend, no
network call and no model inference — the "intelligence" is a deterministic, readable
rule engine over the same in-memory inventory every screen shares. That is deliberate:
the demo must behave identically every time it is presented.

---

## Running it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the production build
npm run lint
```

On a phone the app fills the viewport. On a desktop it renders as a centred
430–440 px device canvas — it is a mobile application that happens to be shown in a
browser, not a shrunken desktop dashboard.

---

## The two demo flows

Both flows genuinely mutate shared state. Nothing is faked between screens.

### Flow A — waste prevention

1. **Home** opens with *"6 foods need your attention"* and the **Use These First** rail,
   ranked by FRISA Waste Risk rather than by date alone.
2. Tap **Spinach** → waste risk **86 / 100**, expires tomorrow.
3. Tap **Find Recipe** → the Recipes tab filters to recipes that use spinach.
4. **Chicken Spinach Stir-Fry** — 92% match, 7 of 8 ingredients available, rescues
   3 at-risk items worth about Rp57,000.
5. **Start Cooking** → tick the steps → **Finish and update inventory**.
6. Spinach leaves the inventory, chicken drops from 450 g to 150 g, and both
   chicken and broccoli fall out of the high-risk band as their remaining stock shrinks.
7. **Insights** shows the money-saved figure and the trend chart moved, with a
   *"+RpXX since you opened the app"* badge.

### Flow B — adding food through the IoT hub

1. **Scan** → *FRISA Camera* → **Show item to FRISA**.
2. Simulated recognition: *Ultra Milk Full Cream 1L*, 94% confidence, category Dairy.
3. Confirm quantity and expiry date → **Confirm & Add**.
4. The item appears in Smart Inventory and in Recent Activity.
5. Open **Ask FRISA** → *"Do I still have milk?"* → the answer is read from the
   inventory you just changed.

There is also a deliberate failure path: **Scan an unlabelled item** produces
*"We need your help identifying this item"* and hands the naming back to the user,
matching the real FRISA workflow rather than pretending the AI is infallible.

---

## The Waste Risk Score

The prototype's central idea, and the piece that turns an expiry list into a
prioritisation engine. Implemented in `src/lib/utils.ts`:

```
risk = urgency(daysUntilExpiry)          // steep in the first 72 hours
     × categorySensitivity               // leftovers and dairy degrade fastest
     + consumptionPatternAdjustment      // what this household actually does
     + remainingStockTerm                // less left in the pack means less at stake
```

| Band | Score | Meaning |
|---|---|---|
| Low | 0–39 | No action needed |
| Medium | 40–69 | Plan a meal this week |
| High | 70–89 | Use today or tomorrow |
| Critical | 90–100 | Use today |

It is food-management intelligence, not a medical or scientific claim, and the UI
says so. The score is recomputed on every render, so it reacts to anything the user
does — consume half a pack and the risk visibly drops.

## Recipe matching

`src/lib/recipes.ts` links every recipe ingredient to a real inventory item by id.
Availability, the missing list, the rescue value and the match score are all derived
from the fridge that is currently selected:

```
matchScore = min(100, round(availableRatio × 100 + priorityIngredients × 1.5))
```

Recommendation order blends urgency, how many at-risk items a recipe clears, and how
well it fits — so a 92% match that rescues three ingredients outranks an 87% match
that rescues one.

## Ask FRISA

`src/lib/assistant.ts` is a deterministic rule-based responder. It reads the live
inventory, so answers stay true after the user adds or cooks something. It handles
expiry queries, recipe suggestions, stock lookups by food name (including foods the
fridge does *not* have), savings, shopping and device status, and falls back to a
capability sentence rather than inventing an answer.

---

## Architecture

```
src/
  components/
    common/      MobileAppShell, BottomNavigation, TopHeader, BottomSheet,
                 ConfirmationSheet, Badges (StatusChip / RiskBadge / ExpiryBadge),
                 Primitives (MetricCard / SegmentedControl / FilterPills / Switch /
                 ListRow / SectionHeader), Feedback (EmptyState / Skeletons / Toast),
                 FoodAvatar, FrisaMark, FridgeSwitcherSheet, OnboardingArt
    home/        HomeHeader, StatusHeroCard, PriorityRail, SmartSuggestionCard,
                 QuickActions, SavingsSummaryCard, RecentActivity
    inventory/   FoodCard, FoodTile
    recipes/     RecipeHeroCard, RecipeRow, RecipeMatchBadge, RecipeArt
    insights/    ChartCard + the four Recharts visualisations + DataTable
    assistant/   AskFrisaSheet
  pages/         Splash, Onboarding, Setup, Home, Inventory, FoodDetail, Scan,
                 Recipes, RecipeDetail, Insights, Notifications, Profile, Fridges,
                 Device, ShoppingList, NotFound
  store/         AppContext (inventory, fridges, notifications, activity, shopping,
                 preferences, session savings), ToastContext, UiContext
  data/          fridges.ts, recipes.ts, insights.ts, seed.ts
  lib/           utils.ts (dates, currency, risk engine), recipes.ts, assistant.ts,
                 storage.ts
  types/         FoodItem, Recipe, Fridge, AppNotification, ActivityEvent, …
```

**State.** One `useReducer` in `AppContext` owns everything. Every screen reads from
the same store, so a change on one screen is immediately visible on the others.

**Persistence.** Only the light, preference-shaped slices are written to
`localStorage`: onboarding completion, setup completion, the selected fridge, fridge
names, food preferences and favourite recipes. Inventory intentionally resets on
reload so every demo starts from a known state. *Restart the demo* in Profile clears
everything.

**Dates.** Seed data stores expiry as an offset in days, converted at load time. The
demo never goes stale — "expires tomorrow" is always literally tomorrow.

---

## Design system

| Token | Value | Used for |
|---|---|---|
| FRISA green | `#25B877` | Primary identity, success, primary buttons |
| Deep green | `#168653` | Headers, gradients, pressed states |
| FRISA orange | `#FC8612` | Urgency, expiry, warnings, the Scan ring |
| App background | `#F7F9F8` | Canvas |
| Surface | `#FFFFFF` | Cards |
| Primary text | `#18211C` | |
| Secondary text | `#66736B` | |
| Border | `#E4EAE6` | |
| Danger | `#C0453C` | Destructive actions only |

Roughly 65–70% neutral, 20–25% green, 5–10% orange. Radii 16–24 px, one shadow
scale, 150–250 ms transitions, minimum 44 px touch targets. Typeface is Plus Jakarta
Sans. **No emoji anywhere** — every glyph is a Lucide icon.

### Charts

Four Recharts visualisations on Insights, all scoped by one period filter
(7 days / 30 days / 3 months) placed above everything it controls:

1. **Food saved trend** — area chart, single green series, no legend needed.
2. **Consumed vs wasted** — donut with a legend that carries the values, so identity
   is never colour alone.
3. **Food waste by category** — horizontal bars, one hue (a single measure across
   nominal categories never gets a value ramp).
4. **Money saved trend** — bars, with the current period emphasised.

The donut palette (`#25B877`, `#FC8612`, `#2E86C9`) was checked with a
colour-vision validator: lightness band, chroma floor, adjacent-pair CVD separation
and normal-vision separation all pass on a white surface. A **table view** toggle in
the header renders every dataset as an accessible `<table>`.

---

## Accessibility

Icon-only controls carry `aria-label`; tabs, switches and toggles expose
`role`/`aria-selected`/`aria-pressed`/`aria-checked`; status is never communicated by
colour alone (waste risk always ships as number + word + icon); focus is visible;
touch targets are at least 44 px; and `prefers-reduced-motion` disables the
animations.

---

## Stack

React 18 · Vite 6 · TypeScript (strict) · Tailwind CSS 3 · Recharts 2 · Lucide React ·
React Router 7. No UI kit, no state library, no backend.
