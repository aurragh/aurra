# Try-On Image — Replicate PhotoMaker (identity-preserving)

Used when a user clicks **Try It On** in the OutfitCard. Sent to `tencentarc/photomaker` on Replicate. PhotoMaker uses the uploaded selfie as an **identity reference** (the `img` keyword anchors it) and applies the outfit while preserving the user's face.

## How PhotoMaker actually works

- Lower `style_strength_ratio` (e.g. 15) → stronger identity preservation (face looks like the user)
- Higher `style_strength_ratio` (e.g. 30+) → more "stylized" face (less recognizable)
- The `img` keyword in the prompt is REQUIRED for PhotoMaker to know which subject is the user
- The prompt should focus on the **outfit and scene**, not on the user's appearance — otherwise PhotoMaker will try to "improve" the face

## Variables
- `{{outfitText}}` — Aurra's primary recommendation in prose, plus the structured items if available (built server-side)
- `{{occasion}}` — the occasion string
- `{{aestheticMood}}` — profile-derived visual tone (same field used by the flat-lay image prompt)

## Settings (in server/openai.ts, not in this file)
- `style_strength_ratio: 15` — minimum recommended for face fidelity
- `num_steps: 30` — sharpness
- `guidance_scale: 5` — balance
- `style_name: "Photographic (Default)"`

## PROMPT
a person img wearing {{outfitText}}, full-body fashion editorial photograph for {{occasion}}, {{aestheticMood}}, clean neutral seamless studio background, soft natural diffused studio lighting, sharp focus on outfit details and fabric texture, same exact face as reference photo, preserve facial features, preserve skin tone, preserve hair color and style, preserve face structure, NET-A-PORTER caliber editorial fashion photography, premium catalog quality, true-to-life color rendering of every garment as described

## NEGATIVE PROMPT
different person, different face, changed face, distorted face, deformed face, asymmetric eyes, asymmetric face, plastic-looking skin, smoothed face, airbrushed face, bad anatomy, extra limbs, extra arms, extra legs, mutated hands, fused fingers, missing fingers, deformed body, duplicate garments, two of any item, multiple shoes, multiple bags, multiple shirts, alternative outfit pieces, layered alternate looks, hangers, mannequins, dress forms, blurry, motion blur, low quality, low resolution, jpeg artifacts, compression artifacts, watermark, text, captions, signature, brand logos, price tags, cartoon, illustration, painting, anime, 3d render, cgi, nsfw, nudity, underwear visible
