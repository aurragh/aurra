# Aurra AI - Fashion Style Generator

## Overview

Aurra AI is a personalized fashion recommendation platform that uses artificial intelligence to generate outfit suggestions based on user preferences, personality traits, and lifestyle factors. The application combines a comprehensive style quiz with AI-powered outfit generation and shopping integration to provide users with tailored fashion advice.

The platform features a freemium model with basic free functionality and premium subscription tiers, gamification elements through a points system, and social features for style collection sharing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with Shadcn/ui component library for consistent design
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
- **Processing**: Style profile analysis and outfit generation based on user preferences, body type, and occasion
- **Fallback**: Graceful degradation when AI services are unavailable

### Data Models
- **Users**: Core user information with Stripe integration for subscription management
- **Style Profiles**: Comprehensive user preferences including personality traits, body type, color preferences, and lifestyle factors
- **Outfits**: AI-generated outfit recommendations with detailed item descriptions and shopping links
- **Collections**: User-curated outfit collections with favoriting capabilities
- **Points System**: Gamification through user points and achievements

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