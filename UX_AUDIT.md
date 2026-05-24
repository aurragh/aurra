# Aurra — UX / UI Audit

Reviewed: dashboard, style-quiz, landing, OutfitCard, StyleDNACard. Findings ordered by impact on first-time client demo.

## 🔴 Critical (fix before client sees it)

### 1. Quiz: duplicate "PHASE 1: WHO YOU ARE" header — **FIXED**
**Where:** [client/src/pages/style-quiz.tsx](client/src/pages/style-quiz.tsx) lines 1073–1074
**Problem:** Two redundant render conditions both fired on Q1, stacking two identical headers.
**Status:** Removed the redundant condition in this commit.

### 2. Missing `<title>` tag on every page
**Where:** [client/index.html](client/index.html)
**Problem:** Browser tab shows raw URL (`aurra-v6em.onrender.com`) instead of "Aurra". Hurts SEO, social shares, multi-tab UX, and looks unfinished.
**Fix:** Add `<title>Aurra — Style for when presence matters</title>` to `<head>`.

### 3. Onboarding flow: quiz can be skipped, but generation silently fails
**Problem:** Dashboard shows "Build your style profile" CTA, but if user closes the modal and clicks "Generate Look", they get `400 Complete your style profile first` toast — confusing dead-end.
**Fix:** Either (a) gate the "Generate Look" input visually with a tooltip when profile incomplete, OR (b) auto-route to `/quiz` when generate is tapped without profile.

### 4. Voice (you flagged this) — robotic + inconsistent
**Where:** [client/src/pages/style-quiz.tsx:626-656](client/src/pages/style-quiz.tsx#L626-L656), nova-chat
**Problem:** Browser `SpeechSynthesis` picks a different voice on every OS/browser. None are good quality.
**Fix:** Replace with ElevenLabs streaming API. Needs your key (see next message).

---

## 🟡 High-impact (do this week)

### 5. Purple-heavy palette feels gloomy under bright office light
The product spec says "dark purple aesthetic" but the current execution leans toward 80% near-black with thin purple accents. Three concrete fixes:

| Where | Now | Suggested |
|---|---|---|
| Page bg | `#0d0812` (almost pure black) | Lift to `#15101e` — keeps mood, adds depth |
| Body text | `text-gray-400` (#9CA3AF, ratio 4.8:1) | `text-gray-300` (#D1D5DB, 8:1) — passes AAA |
| Accent uses | Single hue purple | Add 1 secondary accent (warm gold `#D4AF37` or pale terracotta `#E5A782`) for "WHY" rationale text — visual hierarchy without breaking brand |

### 6. Quiz layout: option list isolated in massive empty space
Screenshot shows ~70% of viewport empty. Mobile-first layout pushed to desktop without re-centering.
**Fix:** `max-w-2xl mx-auto` wrapper on the question stack. Center the column at ~640px max. Adds breathing room without abandoning the layout.

### 7. Quiz progress: `1/11` ticker is tiny + ambiguous
Top-right `1/11` could be questions, phases, time, anything. Users don't know how far they are.
**Fix:** Replace with horizontal progress bar at top of viewport. Color fills purple as user advances. Add text below: "Question 1 of 11 · 30 sec left".

### 8. "Hold to speak" button floats unanchored at bottom
Users may not realize it's a CTA — looks like a floating decoration. Touch target also small for mobile.
**Fix:** Sticky footer with `bg-gradient-to-t from-[#0d0812]` fade. Min height 56px. Add helper text: "Tap to type, hold to speak".

### 9. Dashboard "Style Challenges" row scrolls horizontally with no indicator
Users won't know there are 6 challenges — they see 3.
**Fix:** Add subtle `…` fade on right edge OR pagination dots OR visible "swipe" hint on first load.

### 10. NOVA orb pulsing on every state looks chaotic
Three different pulse animations (`listening`, `processing`, `speaking`) close together visually. Hard to tell apart.
**Fix:** Use color, not animation speed, to differentiate states:
- Listening: purple pulse
- Processing: gold spin
- Speaking: green soft glow
- Idle: static dim purple

---

## 🟢 Medium-impact (next sprint)

### 11. No empty state for "0 outfits"
After completing quiz but before generating, dashboard shows empty card area with no instruction. Users may not realize to click "Generate Look."
**Fix:** Empty-state graphic: "Your first look is one tap away → ↓" pointing to the input bar.

### 12. Logo missing from nav
[client/src/pages/dashboard.tsx:225](client/src/pages/dashboard.tsx#L225) shows `Aurra` as plain text. There's a `Logo.png` in the repo — use it.

### 13. Toasts auto-dismiss too fast for AI loading
"Generating your look..." shows for ~3s then disappears, but generation takes 8-15s. User thinks it failed.
**Fix:** Toast with persistent loader until the response arrives. Or replace toast with inline state on the generate button.

### 14. NOVA chat phrases use "—" everywhere
Em-dashes are stylish but feel dated. Mixing — and "and" makes the tone inconsistent.
**Fix:** Audit `aurra-stylist.md` example outputs — use either dashes OR conjunctions, not both.

### 15. Mobile: dashboard nav has no hamburger when content scrolls
The sticky `Menu` button works, but on mobile small screens it's the only way to navigate. Add bottom nav bar (Home / Quiz / Wardrobe / NOVA) for one-tap access.

---

## 🔵 Polish (when you have time)

- Replace generic emojis in Style Challenges with custom monoline SVG icons (more premium feel)
- Add micro-animations: outfit card hover lift, button press scale
- Add favicon (currently no favicon → browser shows generic globe)
- Loading skeletons for outfit cards instead of spinner
- Save vs. unsave heart icon should bounce on toggle

---

## Suggested fix order for client demo

| Order | Item | Effort |
|---|---|---|
| 1 | Add `<title>` tag (#2) | 30 sec |
| 2 | Gate generate without profile (#3) | 5 min |
| 3 | Lift contrast on body text (#5) | 5 min |
| 4 | Center quiz column (#6) | 5 min |
| 5 | Progress bar instead of `1/11` (#7) | 15 min |
| 6 | Sticky footer for "Hold to speak" (#8) | 10 min |
| 7 | Logo in nav (#12) | 10 min |
| 8 | ElevenLabs voice (#4) | 1 hr + your API key |

Items 1–7 = ~50 minutes. Item 8 is the big lift.
