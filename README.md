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
npm run dev      # development
npm run pwa      # production build + preview, installable as an app
```

The prototype is an installable PWA: opened in a browser it offers **Install FRISA**,
runs full screen from the home screen, and keeps working offline.

## Security

Each FRISA hub carries a device ID and a pairing password. A phone on the same Wi-Fi
sees the hub but gets nothing from it until it enters that password; the hub then
issues a pairing token, and the owner replaces the password printed at the factory.
Wrong attempts are rate limited, and only a salted digest of the password is ever
kept. See the frontend README for the flow and the demo credentials.

## The pitch in one screen flow

Home shows what needs attention today → tap the riskiest ingredient → FRISA proposes a
recipe that clears it → cook it → the inventory updates itself and the savings figures
move. Then scan a new item through the hub camera and ask FRISA about it out loud.

Problem → AIoT → action → measurable household and environmental outcome, in about two
minutes.
