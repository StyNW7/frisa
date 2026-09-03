# FRISA — Fridge's Smart Assistant

Business plan competition repository for **FRISA**, an AIoT food-management ecosystem:
a camera- and voice-equipped device that lives with your refrigerator, paired with a
mobile application that tracks inventory, flags food before it expires and turns what
you already have into meals.

Aligned with **SDG 12 — Responsible Consumption and Production**.

```
Know what you have  →  Use it at the right time  →  Avoid overbuying  →  Reduce food waste
```

## Contents

| Path | What it is |
|---|---|
| `frontend/` | The interactive mobile-first web prototype. See [`frontend/README.md`](frontend/README.md) for the demo script, the Waste Risk Score and the architecture. |
| `docs/Frisa.pdf` | The product concept: features of the IoT device and the mobile app, plus both core workflows. |
| `prompts/build.md` | The build brief the prototype was implemented against. |

## Running the prototype

```bash
cd frontend
npm install
npm run dev
```

## The pitch in one screen flow

Home shows what needs attention today → tap the riskiest ingredient → FRISA proposes a
recipe that clears it → cook it → the inventory updates itself and the savings figures
move. Then scan a new item through the hub camera and ask FRISA about it out loud.

Problem → AIoT → action → measurable household and environmental outcome, in about two
minutes.
