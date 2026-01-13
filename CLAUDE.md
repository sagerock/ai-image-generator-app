# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Optic Engine is an AI image generation web application built with Next.js 15. Users can generate images using 12 different AI models across 3 providers (OpenAI, Replicate, Google Gemini), pay with credits, and manage subscriptions via Stripe.

## Commands

```bash
npm run dev      # Start development server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture

### Model Registry (Single Source of Truth)
All model configurations are centralized in `src/lib/models/`:
- `types.ts` - TypeScript interfaces (`ModelConfig`, `AspectRatio`, `Provider`, `ModelTier`)
- `index.ts` - `MODEL_REGISTRY` object + helper functions (`getModel()`, `getActiveModels()`, `getModelsByTier()`, `getModelCredits()`)
- `dimensions.ts` - Aspect ratio to pixel dimension mappings

Models are organized by tier: fast (1 credit), standard (2 credits), premium (3 credits), ultra (4 credits).

### Provider Adapters
Provider-specific logic is in `src/lib/providers/`:
- `types.ts` - `ImageProvider` interface, `GenerationRequest`, `GenerationResult`
- `openai.ts` - DALL-E 3 adapter
- `replicate.ts` - Handles all Replicate models (FLUX, Ideogram, Imagen, etc.)
- `google.ts` - Gemini/Nano Banana adapter
- `index.ts` - `getProvider()` factory function

### Image Generation Flow
1. Client sends prompt + model ID + Firebase ID token to `/api/generate`
2. Server verifies auth, looks up model in `MODEL_REGISTRY`
3. Checks user credits in Firestore `users` collection
4. Calls appropriate provider via `getProvider(model.provider).generate()`
5. Downloads/processes image, uploads to Firebase Storage
6. Saves metadata to Firestore `generated-images` collection
7. Deducts credits from user

### Authentication & User Management
- Firebase Auth handles authentication (email/password)
- `AuthProvider` (`src/components/AuthProvider.tsx`) wraps the app and provides `useAuth()` hook
- API routes verify Firebase ID tokens via `adminAuth.verifyIdToken()`
- New users automatically get 50 free credits via `createUserProfile()`

### Payments (Stripe)
- `src/lib/stripe-config.ts` - Credit packages and subscription plan definitions
- `/api/stripe/create-checkout` - Creates Stripe checkout sessions
- `/api/stripe/webhook` - Handles Stripe events
- Subscriptions add 400 credits monthly on `invoice.payment_succeeded`

### Firebase Collections
- `users` - User profiles with `credits`, `email`, timestamps
- `generated-images` - Image metadata (userId, prompt, model, imageUrl, etc.)
- `subscriptions` - Active subscription records
- `transactions` - Payment history

## Adding New Models

1. Add entry to `MODEL_REGISTRY` in `src/lib/models/index.ts`:
```typescript
'new-model': {
  id: 'new-model',
  name: 'New Model Name',
  provider: 'replicate', // or 'openai' or 'google'
  providerModelId: 'org/model-name',
  credits: 2,
  tier: 'standard',
  description: 'Description for UI',
  supportedRatios: ['1:1', '16:9', '9:16'],
  dimensionType: 'aspect_ratio', // or 'width_height'
  defaultParams: { /* provider-specific defaults */ },
  tags: ['tag1', 'tag2'],
  isActive: true,
  isNew: true, // optional, shows NEW badge
}
```

2. If the model requires special parameter handling, update the appropriate provider adapter.

## Environment Variables

Required variables (see `env.template`):
- OpenAI: `OPENAI_API_KEY`
- Replicate: `REPLICATE_API_TOKEN`
- Google AI: `GOOGLE_AI_API_KEY`
- Firebase client: `NEXT_PUBLIC_FIREBASE_*` variables
- Firebase Admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Stripe: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- App URL: `NEXT_PUBLIC_APP_URL`

## Key Files

- `src/lib/models/index.ts` - Model registry (single source of truth)
- `src/lib/providers/` - Provider adapters for each AI service
- `src/app/api/generate/route.ts` - Main image generation endpoint
- `src/app/page.tsx` - Main page with generator UI and landing page
- `src/lib/firebase-admin.ts` - Server-side Firebase Admin SDK

## Admin Access

Admin check is done via email allowlist in `src/app/page.tsx`. Admin users can access `/admin` page.
