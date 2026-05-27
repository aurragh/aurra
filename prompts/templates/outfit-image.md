# Outfit Image Generation — Replicate flux-schnell

The flat-lay outfit photo that appears on every OutfitCard. Sent to `black-forest-labs/flux-schnell` on Replicate.

This is a high-stakes prompt. Image quality and accuracy are visible to every user. Goals:

1. **Render exactly what the LLM specified.** Items list is the ground truth. No improvisation.
2. **Reflect the user's profile aesthetically.** The mood, palette, and material treatment should feel chosen, not generic.
3. **Match the House of Nova brand.** Editorial fashion catalog aesthetic — NET-A-PORTER / SSENSE / Aritzia caliber.
4. **No hallucinated extras.** Single item per category. Hard cardinality.

## Variables (injected by `prompts/index.ts`)

- `{{itemsList}}` — bullet list, one line per item, server-built from the structured `items` object the LLM returned. Each line starts with "ONE" to lock cardinality. Lines for `bag`/`accessory` are omitted when those fields are null.
- `{{occasion}}` — the occasion string from the user (e.g. "important board meeting", "dinner in Soho").
- `{{aestheticMood}}` — short profile-derived phrase capturing the visual tone the photo should feel like (e.g. "structured restrained authority", "warm approachable presence", "quiet grounded confidence"). Server derives this from the user's identity word + presence archetype + emotional goal. See `buildAestheticMood()` in `server/openai.ts`.
- `{{paletteAnchor}}` — short profile-derived phrase describing the color story the photo should hit (e.g. "cool-toned neutrals, midnight and charcoal foundation", "warm earthy palette with cream and camel anchors", "monochrome editorial greyscale"). Server derives from colorPalette + skinUndertone.

## PROMPT

Professional fashion editorial flat lay photograph. House of Nova brand aesthetic, NET-A-PORTER caliber. A premium catalog still life of one complete outfit.

OUTFIT (for {{occasion}}):
{{itemsList}}

VISUAL DIRECTION:
- Aesthetic mood: {{aestheticMood}}
- Color story: {{paletteAnchor}}. Faithful color rendering of every item exactly as described above. Do not shift hues. Do not "improve" the palette.
- Material rendering: render the specified fabrics with realistic micro-texture. Wool shows fine grain. Silk shows soft sheen. Leather shows subtle depth. Knit shows weave. Cashmere shows brushed softness. Cotton shows matte body. Polished leather shows controlled highlight, not glare.
- Surface state: each garment appears freshly steamed, never wrinkled, never folded except where it lays naturally on the surface. Shoes are clean and polished.

LAYOUT:
- Aspect ratio 9:16, vertical.
- Pure white seamless paper background, evenly lit, no shadows on the backdrop itself.
- Generous negative space — items occupy roughly the central 60% of the frame.
- Vertical centered composition. Top garment in the upper third. Bottom garment in the middle third. The single pair of shoes in the lower third, toes pointing down.
- If a bag is listed, position it framed-left next to the bottom garment. If an accessory is listed, position it framed-right near the top garment.
- Each item is fully visible, not overlapping another, with about one item-width of breathing space between pieces.

LIGHTING & FINISH:
- Soft diffused overhead studio light, gentle directional fall to the bottom-right (subtle, not theatrical).
- Crisp focus throughout the frame, edge-to-edge sharpness.
- Color-accurate, neutral white balance. No warm filter, no Instagram tone, no film grain.
- Editorial magazine color grading — slightly cool whites, faithful blacks.

CARDINALITY CONTRACT (HARD CONSTRAINTS — DO NOT VIOLATE):
- Render EXACTLY the items in the bulleted list above. ONE of each. No more, no fewer.
- NO duplicate garments anywhere in the frame.
- NO alternative versions of any item (no "or this one" pieces).
- NO additional pieces beyond what is listed (no extra scarves, no extra sunglasses, no extra bags, no extra shoes).
- NO models, mannequins, hangers, dress forms, or human body parts.
- NO text, watermarks, logos, brand labels, price tags, or hand-written notes.
- NO accessories in the frame unless an accessory is explicitly listed above.
- NO bag in the frame unless a bag is explicitly listed above.

QUALITY BAR:
Ultra sharp focus. Crisp realistic textures. Magazine-quality color grading. Premium fashion catalog standard. The image should be indistinguishable from a high-end retailer's product flat lay (NET-A-PORTER, SSENSE, MR PORTER). Studio quality, commercial fashion photography.
