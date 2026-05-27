# Outfit Recommendation — User Prompt Template

Rendered for every `/api/generate-outfits` call. All values come **directly from the user's stored quiz answers** (the `style_profiles` table). No randomness, no fabrication — every line below traces back to a quiz question.

## Variables (injected by `prompts/index.ts`)
### Phase 1 — psychological signature
- `{{identityWord}}` — Q1
- `{{dressingRelationship}}` — Q2
- `{{impressionGoals}}` — Q3 (multi, comma-joined)
- `{{confidenceTrigger}}` — Q4
- `{{emotionalGoal}}` — Q5

### Phase 2 — presence + appearance + style depth
- `{{presenceArchetype}}` — Q6
- `{{bodyType}}` — Q7
- `{{gender}}` — Q8 (styling direction)
- `{{height}}` — Q9
- `{{skinUndertone}}` — Q10
- `{{hairColor}}` — Q11
- `{{eyeColor}}` — Q12
- `{{faceShape}}` — Q13
- `{{colorPalette}}` — Q14
- `{{colorComfort}}` — Q15
- `{{accessories}}` — Q16
- `{{fabric}}` — Q17
- `{{industry}}` — Q18
- `{{dailyRoutine}}` — Q19

### Phase 3 — decision
- `{{budget}}` — Q20
- `{{sustainability}}` — Q21
- `{{occasion}}` — chosen at generation time (rich phrase built from Q22 + context)
- `{{intentMoments}}` — Q22 (multi, comma-joined)

---

## CONTEXT: USER STYLE PROFILE

### Psychological signature (Phase 1)
- Identity word (how they describe themselves at their best): **{{identityWord}}**
- Dressing relationship: **{{dressingRelationship}}**
- Impression goals (what they want others to feel): **{{impressionGoals}}**
- Confidence trigger (what they wear when most confident): **{{confidenceTrigger}}**
- Emotional goal when dressed right: **{{emotionalGoal}}**

### Presence & physical (Phase 2)
- Presence archetype: **{{presenceArchetype}}**
- Body type / frame: **{{bodyType}}**
- Styling direction: **{{gender}}**
- Height: **{{height}}**
- Skin undertone: **{{skinUndertone}}**
- Hair color: **{{hairColor}}**
- Eye color: **{{eyeColor}}**
- Face shape: **{{faceShape}}**

### Style preferences (Phase 2)
- Color palette: **{{colorPalette}}**
- Color comfort level: **{{colorComfort}}**
- Accessory style: **{{accessories}}**
- Fabric preference: **{{fabric}}**
- Industry: **{{industry}}**
- Daily routine: **{{dailyRoutine}}**

### Today's decision (Phase 3)
- Budget tier per piece: **{{budget}}**
- Sustainability priority: **{{sustainability}}**
- Occasion: **{{occasion}}**
- Key moments where presence matters: **{{intentMoments}}**

---

## YOUR TASK

Produce one outfit recommendation following the **CORE PROMISE** structure from your system instructions. Ground every choice in the profile above — especially:

- **Identity + presence + emotional goal** for tone and posture of the recommendation
- **Body type + styling direction + height** for silhouette and proportion
- **Skin undertone + hair + eye** for color compatibility (specific colors, not generic palettes)
- **Face shape** for neckline / collar / accessory placement
- **Color comfort + fabric + accessory style** for the surface details
- **Budget + sustainability** for material quality and brand-tier suggestions
- **Occasion + impression goals** for the situational appropriateness

Do not invent any preferences not stated above. If a field is "not specified", treat it as unknown and avoid making assumptions in that dimension.

Respond with valid JSON only — no markdown fences, no preamble, no commentary.

### Required JSON schema

```json
{
  "primary": "one decisive recommendation, single sentence in plain prose",
  "items": {
    "top": "specific top garment description: color + cut + fabric (e.g. 'navy single-breasted wool blazer over an ivory silk shell')",
    "bottom": "specific bottom garment description: color + cut + fabric",
    "shoes": "one pair, specific style and color, no alternatives",
    "bag": "one bag, specific style and color, OR null if not appropriate for the occasion",
    "accessory": "at most one small accessory (watch, belt, scarf, eyewear) OR null if accessories are minimal in this look"
  },
  "backup": "secondary direction in plain prose",
  "avoid": "what to exclude",
  "why": "rationale grounded in profile"
}
```

### Strict constraints on `items`

- Exactly one garment per category. No duplicates. No "or" alternatives inside a single field.
- Item descriptions must be visually concrete (color + cut + fabric or material), not abstract ("appropriate top" is not valid; "navy single-breasted wool blazer" is).
- If a category is genuinely not part of the look (e.g. no bag for a black-tie event), set that field to `null`. Do not invent items to fill slots.
- `accessory` should be `null` unless the recommendation specifically calls for one. Most looks have at most one statement piece.
- The items must exactly match the garments named in `primary`. The image renderer reads from `items`, not from `primary`.
