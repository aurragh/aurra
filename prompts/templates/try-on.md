# Try-On Image — Replicate PhotoMaker (identity-preserving)

Used when a user clicks **Try It On** in the OutfitCard. Sent to `tencentarc/photomaker` on Replicate. PhotoMaker uses the uploaded selfie as an **identity reference** (the `img` keyword anchors it) and applies the outfit while preserving the user's face.

## How PhotoMaker actually works

- Lower `style_strength_ratio` (e.g. 15) → stronger identity preservation (face looks like the user)
- Higher `style_strength_ratio` (e.g. 30+) → more "stylized" face (less recognizable)
- The `img` keyword in the prompt is REQUIRED for PhotoMaker to know which subject is the user
- The prompt should focus on the **outfit and scene**, not on the user's appearance — otherwise PhotoMaker will try to "improve" the face

## Variables
- `{{outfitText}}` — Aurra's primary recommendation (the outfit description)
- `{{occasion}}` — the occasion (currently unused in prompt, available if needed)

## Settings (in server/openai.ts, not in this file)
- `style_strength_ratio: 15` — minimum recommended for face fidelity
- `num_steps: 30` — sharpness
- `guidance_scale: 5` — balance
- `style_name: "Photographic (Default)"`

## PROMPT
a person img wearing {{outfitText}}, full body fashion editorial photo, clean neutral studio background, soft natural lighting, sharp focus on outfit details, same exact face as reference photo, preserve facial features, preserve skin tone, preserve hair color and style, realistic photography, high-end fashion magazine quality

## NEGATIVE PROMPT
different person, different face, changed face, distorted face, deformed face, asymmetric eyes, bad anatomy, extra limbs, mutated hands, fused fingers, blurry, low quality, jpeg artifacts, watermark, text, signature, cartoon, illustration, painting, anime, nsfw
