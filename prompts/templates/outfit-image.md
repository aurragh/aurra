# Outfit Image Generation — Replicate flux-schnell

Used for the **flat-lay outfit photo** that appears on every OutfitCard. Sent to `black-forest-labs/flux-schnell` on Replicate.

The prompt is intentionally restrictive. Flux will happily improvise extra items if you give it loose categorical lists, so we constrain count explicitly and avoid plural language.

## Variables (injected by `prompts/index.ts`)
- `{{itemsList}}` — bullet list of items, one per line, built server-side from the structured `items` object the LLM returned. Each line begins with "ONE" to lock cardinality.
- `{{occasion}}` — the occasion string (e.g. "important board meeting")

## PROMPT
Professional fashion photography flat lay on pure white seamless background. Single outfit composition. ONE garment per category. No duplicates. No alternative pieces shown. No variants.

The outfit, for {{occasion}}:
{{itemsList}}

Layout: vertical composition, centered. Top garment in the upper third of the frame. Bottom garment in the middle third. Single pair of shoes in the lower third. Bag (if present) framed at the left. Accessory (if present) at the right. Generous negative space.

Hard constraints: exactly the items listed above, ONE of each. NO duplicate garments. NO alternative versions. NO additional pieces beyond those listed. NO models, mannequins, or hangers. Pure white seamless background. Even soft studio lighting.

Editorial fashion catalog aesthetic. Crisp studio lighting. Ultra sharp focus. Luxury brand photography. High-end fashion magazine quality.
