# Aurra Storefront — PM Roadmap

The blueprint you pasted is a **separate, full-stack consumer fashion e-commerce platform** that wraps the existing AI stylist app. This is a 9–20 week build per the blueprint's own estimates. It is not an extension of what we've shipped — it's a second product.

This document is the honest PM read on scope, dependencies, and where to start.

---

## What you have today (live)

| | |
|---|---|
| URL | https://aurra-v6em.onrender.com |
| Role | **AI Stylist app** (Phase 3 / "stylist-api" + quiz UI in the blueprint) |
| Stack | Next.js? No → Vite + Express monolith on Render |
| DB | Neon Postgres (1 DB, no pgvector yet) |
| AI | Claude Sonnet 4.6 + Replicate (images) + ElevenLabs (voice) |
| Auth | Google OAuth (single user model — no admin role) |
| Commerce | None |
| CMS | None |

## What the blueprint adds

| Layer | New work | Why |
|---|---|---|
| **Storefront** (Next.js 15 + Hydrogen) | Brand-new repo / app | Editorial PDP, lookbooks, cart, checkout |
| **Shopify** (Storefront + Admin APIs) | Account, dev store, products, payments | Avoids 6 weeks of custom commerce |
| **Sanity CMS** | Schemas + Studio app | Stories, lookbooks, homepage hero |
| **pgvector** | Postgres extension + product embeddings | Vector search over real catalog |
| **NestJS API** | Rewrite of current Express server | Modular structure for the stylist engine |
| **Voyage AI / OpenAI embeddings** | Product + profile vectors | Candidate retrieval before Claude |
| **Auth.js + magic links** | Replace Google-only OAuth | Lower friction for B2C |
| **BullMQ + Redis** | Background jobs | Product sync, emails, pre-warm |
| **Resend** | Transactional email | Magic links, orders, abandoned cart |
| **Cloudinary / S3** | Image hosting | Render disk is ephemeral (we already hit this) |

## What it does NOT add

- The current quiz logic (we already have 22 questions, prompt registry, voice)
- The Claude integration (already done with Sonnet 4.6 + caching)
- The OAuth flow (we already have Google; Auth.js is a rewrite, not new functionality)

## Decision: rewrite vs. extend

**Two paths.**

### Path A — Greenfield rewrite (blueprint as written)
- Stand up `apps/storefront` (Next.js 15) + `apps/stylist-api` (NestJS) + `apps/studio` (Sanity)
- Migrate the existing quiz / prompts / voice / DB schema into the new structure
- 9–20 weeks per blueprint estimates
- **Pro:** Right architecture for the final product. SEO from day 1. SSR + edge.
- **Con:** Throws away most of the React + Vite + Express work. New auth. New hosting. New deploy pipeline.

### Path B — Bolt commerce + CMS onto current app
- Keep current Vite/Express/Render app
- Add Shopify Storefront API client → product pages + cart in the SPA
- Add Sanity → editorial pages in the SPA
- Add pgvector to existing Neon DB
- Use existing Google OAuth (add magic-link later)
- **Pro:** ~3–4 weeks to a working v1. Reuses everything.
- **Con:** Less editorial feel without Next.js SSR. Worse SEO (SPA limits). Harder to do scroll-driven story pages.

### Path C — Hybrid (recommended)
- **New repo:** `aurra-storefront` (Next.js 15 only — frontend + Shopify + Sanity)
- **Keep current app** at `aurra-v6em.onrender.com` as the AI stylist API + quiz UI
- Storefront calls the existing AI app for recommendations via REST
- Storefront has its own URL (e.g. `aurra.shop` or `houseofnova.com`)
- Marketing site links to existing app for the quiz/dashboard
- **Pro:** Doesn't throw away shipped work. New Next.js app focused only on storytelling + commerce.
- **Con:** Two services to maintain. Cross-origin OAuth needs care.

---

## My recommendation: **Path C**

The current app is solid and ships outfit recommendations end-to-end. Rewriting it now is throwing away working code to satisfy an architectural ideal.

What we actually need from the storefront is the **commerce + story layer** — the part we haven't built. Build that as a separate Next.js app, talking to the existing AI app via API.

## Phase plan (Path C)

| Phase | Time | Deliverable | Blocker on you |
|---|---|---|---|
| 0. Decisions | 1 day | Brand name (Aurra vs House of Nova?), domain, Shopify account, Sanity account | All you |
| 1. Storefront skeleton | 1 wk | New Next.js 15 repo, Tailwind, shadcn, deploys to Vercel | Vercel account |
| 2. Shopify wiring | 1 wk | Sample products, PDP, cart, checkout redirect | Dev store + ~20 sample products |
| 3. Sanity wiring | 1 wk | Homepage, one story, one lookbook | Sanity schemas + first content |
| 4. AI handoff | 3 days | Quiz CTA on storefront → redirects to existing `aurra-v6em.onrender.com/quiz` with return URL | Shared session cookie or token |
| 5. Editorial polish | 1 wk | Framer Motion + Lenis + scroll animations on landing + lookbooks | Design refs |
| 6. Real catalog | ongoing | 30–50 real products in Shopify | Photography + product data |
| 7. Launch polish | 1 wk | SEO, sitemap, analytics, error monitoring | Domain DNS |

**Total to MVP: 5–6 weeks of focused work** (vs. 9–20 weeks for full rewrite).

## What I need from you to start Phase 0

| Decision | Options | My PM call |
|---|---|---|
| Final brand name | "Aurra" / "House of Nova" / both | "Aurra" — already in use, domain available, simpler |
| Domain | aurra.shop, aurra.style, aurra.ai, etc. | aurra.shop (commerce signal, ~$30/yr) |
| Currency | INR-only / USD / both | INR-first per your context |
| Shopify plan | Trial then Basic ($29/mo) | Trial first |
| Image hosting | Shopify CDN + Cloudinary | Shopify CDN for products, fix Render ephemeral disk for try-on images via Cloudinary (~$0/mo free tier) |
| Catalog source for testing | Real products or mock data | Mock first, real before launch |
| Launch date target | TBD | I recommend 6 weeks from green-light |

## Critical risks to flag

1. **Photography is the real blocker.** A premium-feeling fashion site needs premium product shots. No tech stack saves you here. Budget for a photographer or use AI-generated lookbook imagery (Replicate flux-pro / SDXL).
2. **Render ephemeral disk** — already biting us with try-on photos. Need to fix before storefront launches; recommend Cloudinary or Shopify CDN for all user-uploaded images.
3. **Two domains, one user.** If `aurra.shop` users sign in there, then visit `aurra-v6em.onrender.com/quiz`, they appear logged out. Solutions: (a) put both on same root domain, (b) use cross-origin cookies, (c) move the quiz into the storefront and have storefront call AI service. Option (c) is cleanest but adds work.
4. **Single dev resource.** All current shipped features were single-developer. The blueprint assumes one experienced engineer for 9–20 weeks. Plan accordingly.

---

## Next step

Tell me:
1. **Go / no-go on Path C** (or vote for A or B)
2. **Brand + domain decision**
3. Whether you want me to **scaffold the new `aurra-storefront` repo today** or wait

If you say go, I'll start Phase 0 + Phase 1 in the next session: new repo, Next.js 15 boilerplate, design tokens, Vercel deploy.
