# Outfit Image Generation — Replicate flux-schnell

Used for the **flat-lay outfit photo** that appears on every OutfitCard. Sent to `black-forest-labs/flux-schnell` on Replicate.

Edit the prompt below to change how generated outfit images look. The whole `## PROMPT` body is sent verbatim (with variables interpolated).

## Variables
- `{{itemsDesc}}` — comma-joined description of outfit items (color + category). Defaults to `"stylish outfit"` if empty.
- `{{occasion}}` — the occasion string (e.g. "important board meeting")

## PROMPT
Professional fashion photography: complete outfit flat lay on pure white background. Items: {{itemsDesc}} for {{occasion}}. Vertically arranged: top garment at top, bottom garment in middle, shoes at bottom, accessories around. High-end fashion catalog aesthetic, crisp studio lighting, editorial quality. Ultra sharp focus, luxury brand photography. No models, no mannequins, no hangers.
