# prompts/

Single source of truth for every LLM call in Aurra. The server (`server/openai.ts`) imports nothing but the registry in `index.ts` — no hard-coded strings, no random model behavior. Every output traces back to a file in this folder.

## Layout

```
prompts/
├── README.md                          ← you are here
├── index.ts                           ← loader + renderer (vars: {{key}})
├── system/
│   └── aurra-stylist.md               ← cached system prompt (3 call sites)
└── templates/
    ├── outfit-recommendation.md       ← used by /api/generate-outfits
    ├── nova-chat.md                   ← appended to system for /api/nova-chat
    ├── shopping-extraction.md         ← used by /api/shopping-extract
    └── style-analysis.md              ← used by /api/style-analysis
```

## How a quiz answer becomes an outfit

```
User completes quiz
   │
   ▼ POST /api/style-profile
[ style_profiles table ]
   │
   ▼ POST /api/generate-outfits   (with chosen occasion)
buildOutfitVars(profile, occasion)   ← server/openai.ts
   │                                   maps every DB column to {{var}}
   ▼
renderOutfitPrompt(vars)             ← prompts/index.ts
   │                                   interpolates outfit-recommendation.md
   ▼
client.messages.create({
  system: aurraSystemBlock (cached),  ← from system/aurra-stylist.md
  messages: [{ role: "user", content: rendered }]
})
```

The console log `[aurra] generating outfit. Vars: {...}` shows the exact input on every generation. If an output feels generic, check the log — it'll show empty fields where the quiz wasn't completed.

## Editing a prompt

1. Open the `.md` file
2. Change the text
3. Restart server (the registry loads files at boot)
4. No code changes needed

## Variable conventions

- `{{snake_or_camel}}` — interpolated from the `vars` object in `index.ts`
- Unfilled vars render as the string `not specified` (not empty), so the model knows the field was checked
- All template var names match the keys of the `OutfitVars`, etc. interfaces in `index.ts`

## Why caching matters

`system/aurra-stylist.md` is ~3000 tokens and gets sent on every call. With `cache_control: ephemeral`:
- First call: pays full input cost + ~1.25× to write cache
- Next 5 minutes of calls: pay ~0.1× for those tokens (90% discount)

Watch the log line `[aurra] usage in=X out=Y cache_read=Z cache_write=W` — high `cache_read` means caching is working.

## Adding a new prompt

1. Drop a `.md` file under `templates/`
2. Add a `load(...)` + `render(...)` helper in `index.ts`
3. Import + call from `server/openai.ts` (or `server/routes.ts`)
