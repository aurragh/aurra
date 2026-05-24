# Outfit Recommendation — User Prompt Template

Rendered for every `/api/generate-outfits` call. All values come **directly from the user's stored quiz answers** (the `style_profiles` table). No randomness, no fabrication — every line below traces back to a quiz question.

## Variables (injected by `prompts/index.ts`)
- `{{identityWord}}` — Q1 (single)
- `{{dressingRelationship}}` — Q2 (single)
- `{{impressionGoals}}` — Q3 (multi, comma-joined)
- `{{confidenceTrigger}}` — Q4 (single)
- `{{presenceArchetype}}` — Q5 (single)
- `{{bodyType}}` — Q6 (single)
- `{{colorPalette}}` — Q7 (single — joined to string)
- `{{industry}}` — Q8 (single, from lifestyle.industry)
- `{{dailyRoutine}}` — Q9 (single, from lifestyle.dailyRoutine)
- `{{budget}}` — Q10 (single)
- `{{occasion}}` — Q11 (chosen at generation time, not from quiz)
- `{{intentMoments}}` — Q11 multi, comma-joined (defaults to `{{occasion}}` if empty)

---

## CONTEXT: USER STYLE PROFILE

### Psychological signature (from style quiz)
- Identity word (how they describe themselves at their best): **{{identityWord}}**
- Dressing relationship: **{{dressingRelationship}}**
- Impression goals (what they want others to feel): **{{impressionGoals}}**
- Confidence trigger (what they wear when most confident): **{{confidenceTrigger}}**
- Presence archetype: **{{presenceArchetype}}**

### Physical & practical
- Body type: **{{bodyType}}**
- Color palette preference: **{{colorPalette}}**
- Budget tier: **{{budget}}**
- Industry: **{{industry}}**
- Daily routine: **{{dailyRoutine}}**

### Today's situation
- Occasion: **{{occasion}}**
- Key moments where presence matters: **{{intentMoments}}**

---

## YOUR TASK

Produce one outfit recommendation following the **CORE PROMISE** structure from your system instructions. Ground every choice in the profile above — especially the identity word, presence archetype, and impression goals. Do not invent any preferences not stated above.

Respond with valid JSON only — no markdown fences, no preamble, no commentary.
