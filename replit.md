# Aurra AI - Fashion Style Generator

## Overview

Aurra AI is a personalized fashion recommendation platform that uses artificial intelligence to generate outfit suggestions based on user preferences, personality traits, and lifestyle factors. It combines a comprehensive style quiz with AI-powered outfit generation and shopping integration. The platform provides tailored fashion advice and is currently fully free, with all subscription/upgrade flows hidden. Key features include a conversational AI stylist (NOVA), a personalized digital wardrobe, and a "Try It On" feature that allows users to visualize outfits on their own photo.

The project aims to leverage AI to personalize fashion for users, offering a unique and engaging experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Visual Design**: Dark purple aesthetic throughout with an emphasis on clean, focused interfaces.
- **Components**: Shadcn/ui component library, Radix UI for unstyled accessible primitives, Lucide React for icons.
- **Typography**: Google Fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono).
- **Dashboard**: Redesigned with a single text input for "Generate Look" and a slim count line for stats.
- **OutfitCard**: Dark-themed with actions for saving, viewing details, and shopping.
- **Modals**: Dark-themed shopping and "Try It On" modals with skeleton loading.
- **NOVA Chat Stylist**: Full-screen conversational AI with an animated pulsing orb, starter prompts, and browser TTS.
- **Style DNA Card**: Dark purple gradient card displaying user's style identity with a collapsible header.
- **Digital Wardrobe**: Category filter tabs, item cards with details, and an "Add Item" modal.
- **NOVA Voice AI Quiz**: Conversational chat-style UI with animated chat bubbles, voice synthesis, and speech recognition.
- **Image Display**: Lightbox modal for zoomable outfit images.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, TailwindCSS, TanStack Query for state, Wouter for routing.
- **Backend**: Node.js with Express.js, TypeScript (ES modules), Drizzle ORM with PostgreSQL, connect-pg-simple for session storage.
- **Authentication**: Passport-based session authentication with Replit Auth (OpenID Connect).
- **AI Integration**:
    - **Outfit Generation**: Replicate API (flux-schnell model) for image generation (portrait 9:16 aspect ratio, WebP output).
    - **"Try It On" Feature**: Replicate PhotoMaker model (`tencentarc/photomaker`) for photorealistic AI images.
    - **Text Recommendations**: OpenAI GPT-4o for conversational responses and text-based shopping item extraction.
    - **Shopping Assistant**: GPT-4 Vision (GPT-4o) for analyzing outfit images and extracting item details (used for "Shop This Look"). This was later replaced with text-based extraction using GPT-4o for efficiency.
    - **Style Quiz Logic**: OpenAI API for personalized outfit recommendations and "why" reasoning based on psychological data.
    - **Image Style**: Ghost mannequin / invisible model style for professional studio product photography, pure white background, no models.
- **Data Models**: Users, Style Profiles (comprehensive preferences), Outfits (AI-generated with shopping links), Collections, Points System, Wardrobe Items, Shopping Analytics (click tracking).
- **Trash System**: Soft delete functionality for outfits with 30-day retention and a dedicated trash page.
- **Deployment**: Production-ready cleanup, removal of all subscription/upgrade references for free-tier launch.

## External Dependencies

- **AI Services**:
    - OpenAI API (GPT-4o, GPT-4 Vision)
    - Replicate API (flux-schnell model, PhotoMaker model)
- **Database**:
    - Neon Database (Serverless PostgreSQL)
- **Authentication**:
    - Replit Auth (OpenID Connect)
- **Payment Processing**:
    - Stripe (for potential future subscription management)
    - PayPal (for potential future subscription upgrades)
- **Development Tools**:
    - Drizzle Kit (database schema management)
    - Vite (build tool)
    - Replit Integration