# Aurra AI - Fashion Style Generator

## Overview

Aurra AI is a personalized fashion recommendation platform that uses artificial intelligence to generate outfit suggestions based on user preferences, personality traits, and lifestyle factors. The application combines a comprehensive style quiz with AI-powered outfit generation and shopping integration to provide users with tailored fashion advice.

The platform is currently **fully free** — all subscription/upgrade flows are hidden. Image generation uses Replicate API (flux-schnell model). Text recommendations use OpenAI GPT-4o.

## Recent Updates (Mar 7, 2026) — Session 2

- **NOVA Chat Stylist** (`/chat`): Full-screen conversational AI chat interface
  - NOVA orb in sticky header, animated pulsing when speaking
  - 4 starter prompt chips on first load for quick questions
  - Chat history in component state (resets on reload — no DB storage)
  - POST /api/nova/chat — fetches user's style profile, injects as context, responds via GPT-4o in conversational mode (2–4 sentences, plain text, in character)
  - Browser TTS for NOVA replies (same voice system as quiz), mute toggle
  - Accessible from dashboard floating button (bottom right) and dropdown menu

- **Style DNA Card**: Visual identity card displayed at top of dashboard (for users with completed profiles)
  - Dark purple gradient card with 4 identity chips: Identity / Presence / Palette / World
  - Aurra-style 1-sentence profile summary generated client-side from psychological answers
  - Collapsible header with expand/collapse toggle
  - "Edit Profile" link at bottom right to /quiz

- **Digital Wardrobe** (`/wardrobe`): Personal clothing inventory
  - New DB table: `wardrobe_items` (id, userId, name, category, color, brand, season, notes, createdAt)
  - Category filter tabs: All / Tops / Bottoms / Shoes / Outerwear / Accessories
  - Item cards with color chip, category badge, brand/season labels, delete button
  - "Add Item" modal form with full fields
  - Empty state per-category
  - API: GET/POST/DELETE /api/wardrobe (authenticated)
  - Accessible from dashboard dropdown menu

## Recent Updates (Mar 7, 2026)

- **NOVA Voice AI Quiz**: Completely redesigned style quiz as a psychological profiling chatbot
  - Conversational chat-style UI — NOVA presents questions as animated chat bubbles (typewriter effect)
  - Animated purple orb avatar in sticky header, pulsing when idle/speaking/listening
  - 11 psychological questions across 3 phases: Who You Are / How You Show Up / The Decision
  - Phase 1: identity word, dressing relationship, impression goals, confidence trigger
  - Phase 2: presence archetype, body frame, color palette, industry, daily routine
  - Phase 3: investment range, occasions
  - Single-select questions auto-advance 700ms after selection (no Next button)
  - Multi-select questions show Continue button after selecting
  - Answered questions show compact NOVA+user chat history with user bubbles on the right
  - Web Speech API voice: NOVA speaks questions aloud (SpeechSynthesis), user can hold mic to answer (SpeechRecognition) — no API key needed, built into browser
  - NOVA intro speech on load: "Hi, I'm NOVA. I'll help you build your style profile."
  - Mute button toggles NOVA's voice; graceful fallback if voice not supported
  - Richer psychological profile stored in `personality` JSON field
  - System prompt and OpenAI prompt updated to use psychological data for personalized "why" reasoning

- **Production-ready cleanup**: Removed all subscription/upgrade references for free-tier launch
  - Pricing section removed from landing page
  - "Pricing" nav link removed from navigation
  - "Upgrade Plan" removed from dashboard menu
  - /upgrade and /subscribe routes now redirect to /dashboard
  - Points redemption simplified to "Free Outfit" only (no premium trial or discount codes)
  - Footer links cleaned up: removed dead placeholder links, added mailto contact
  - Copyright year updated to 2026
  - "Learn More" button now scrolls to Features section (was a console.log TODO)

- **Replicate API image generation**: Replaced DALL-E with Replicate's flux-schnell model
  - Token stored as REPLICATE_API_TOKEN secret
  - Portrait 9:16 aspect ratio for full outfit visualization
  - WebP output format, quality 90

## Previous Updates (Feb 4, 2026)

- **Points Redemption System**: Users can now redeem earned points for rewards
  - Free Outfit Credit (50 pts): Generates an outfit without earning points (prevents double benefit)
  - 24-Hour Premium Trial (100 pts): Activates premium features for 24 hours
  - $2 Discount Code (200 pts): Generates a unique code for upgrade discount
  - New users receive 100 welcome bonus points automatically
  - Dashboard "Rewards" tab displays points balance, active rewards, and transaction history
  - Discount codes are validated server-side and consumed upon upgrade
  - Free outfit credits are automatically used when generating outfits

- **Enhanced Aurra Voice & Intelligence**: Updated system prompt with complete spec compliance
  - Added "What Aurra NEVER Does" list (endless options, body type comments, AI jargon)
  - Added "What Aurra ALWAYS Does" list (anchors in presence, names what to avoid)
  - Added 3 sample outputs to guide AI tone precisely
  - Expanded language examples (Hold, Control, Read the room, Grounded, Restraint)

- **PayPal Payment Integration**: Added upgrade subscription flow
  - Premium ($9.99/mo) and Pro ($24.99/mo) plans available
  - PayPal checkout button integration
  - Test mode for instant upgrade activation
  - Upgrade page accessible from dashboard menu

- **Master Admin Access**: Added admin privileges for testing
  - Admin emails: writersure369@gmail.com, novacreates888@gmail.com
  - Full access to admin dashboard and all features

- **Improved Image Quality v2**: Flat lay style for complete outfit visualization
  - Portrait orientation (1024x1792) for full top-to-bottom display
  - Flat lay arrangement: top garment at top, bottom in middle, shoes at bottom
  - High-end fashion catalog aesthetic with crisp shadows
  - Pure white background, no models or mannequins
  - Professional product photography quality

- **Shopping Feature Fix**: Resolved "undefined" display issue in shopping modal
  - Added proper null checking for all item properties (name, description, category, searchQuery)
  - Invalid items are now filtered out before display
  - Fallback values provided for any missing fields
  - Defensive guard added to handle malformed AI responses

## Previous Updates (Oct 29, 2025)

- **Shopping Assistant Feature**: AI-powered shopping link generation for outfit items
  - Uses GPT-4 Vision to analyze outfit images and identify individual clothing/accessory items
  - Extracts each item with detailed descriptions (name, category, style, material)
  - Generates Google Shopping search URLs for each identified item
  - "Shop This Look" button on all outfit cards (when image is present)
  - Shopping modal displays all extracted items with dedicated shopping buttons
  - Click analytics tracking to understand user shopping behavior and preferences
  - Free for all users (freemium MVP approach to validate demand)
  - Future enhancement: Upgrade to affiliate APIs (Amazon, Zara, H&M) once traffic validates demand

## Previous Updates (Oct 28, 2025)

- **Improved Dashboard UI**: Removed rotating backgrounds from dashboard for cleaner, focused interface
- **Style Quiz Enhancements**: 
  - Changed style personality to single-select (radio buttons) instead of multi-select
  - Removed "Which items do you need help styling?" question completely
  - Simplified quiz flow for better user experience
- **Zoomable Outfit Images**: Added lightbox modal for viewing outfit images in full-size with zoom capability
- **Trash System Implementation**: Added soft delete functionality with 30-day retention period for outfit management
  - Outfit cards now have delete buttons for easy removal
  - Deleted outfits are moved to trash and can be restored within 30 days
  - Dedicated trash page for viewing and managing deleted items
  - Automatic permanent deletion after 30 days

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with Shadcn/ui component library for consistent design
- **Visual Design**: Rotating background images with smooth 5-second crossfade animation across all pages
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Passport-based session authentication with Replit Auth integration

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling and request logging

### Authentication System
- **Provider**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Server-side sessions with secure HTTP-only cookies
- **Authorization**: Role-based access control with middleware protection for authenticated routes

### AI Integration
- **Provider**: OpenAI API for generating personalized outfit recommendations
- **Image Generation**: DALL-E 3 with HD quality (1024x1024 square format)
- **Image Style**: Ghost mannequin / invisible model style - professional studio product photography
  - SINGLE outfit composition centered in frame (not multiple variations or collection layouts)
  - Clothes arranged as if worn on an invisible body/form
  - White studio backgrounds with visible photography equipment (softbox, tripod, lights)
  - Includes complete outfits with all accessories (shoes, bags, jewelry, etc.)
  - Sharp focus and high detail rendering
  - ONE complete look only - explicitly prevents lookbook/variation displays
  - Focuses on outfit composition rather than models
- **Vision Analysis**: GPT-4 Vision (GPT-4o) for shopping assistant functionality
  - Analyzes outfit images to identify individual clothing and accessory items
  - Extracts structured data: item name, description, category, and optimized search queries
  - On-demand extraction (only when user clicks "Shop This Look" to optimize API costs)
  - Returns JSON-formatted results for reliable parsing
- **Processing**: Style profile analysis and outfit generation based on user preferences, body type, and occasion
- **Fallback**: Graceful degradation when AI services are unavailable
- **Future Enhancement**: Ready to integrate Stable Diffusion via Replicate API for even better image quality and control

### Data Models
- **Users**: Core user information with Stripe integration for subscription management
- **Style Profiles**: Comprehensive user preferences including personality traits, body type, color preferences, stylePreferences (multi-select), clothingItems (multi-select), lifestyle factors, and occasions (multi-select)
- **Outfits**: AI-generated outfit recommendations with HD ghost mannequin style images (1024x1024), complete with accessories, detailed item descriptions, and shopping links
- **Collections**: User-curated outfit collections with favoriting capabilities
- **Points System**: Gamification through user points and achievements
- **Shopping Analytics**: Click tracking for shopping link interactions (outfit_id, item_name, search_query, timestamp) to understand user shopping behavior and optimize future integrations

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure for subscription management
- **Integration**: React Stripe.js for frontend payment forms
- **Webhooks**: Server-side webhook handling for subscription events

### Database Infrastructure
- **Neon Database**: Serverless PostgreSQL provider with connection pooling
- **Migration**: Drizzle Kit for database schema management and migrations
- **Connection**: WebSocket-based connections for optimal performance

### UI/UX Libraries
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom design tokens

### Development Tools
- **Replit Integration**: Native Replit development environment support
- **Error Handling**: Runtime error overlay for development debugging
- **TypeScript**: Full type safety across frontend and backend with shared schemas

### Third-Party Services
- **OpenAI**: AI-powered outfit generation and style analysis
- **Font Integration**: Google Fonts for typography (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Asset Management**: Static asset serving with Vite optimization