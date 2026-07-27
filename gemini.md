# YMUTE Platform – Senior Engineer & Design Directives (`gemini.md`)

This document serves as the authoritative project directive (`agent.md`) for AI assistants and engineers pair-programming on the **YMUTE Platform** codebase (`ymute-app`). All architectural modifications, component designs, and code changes MUST adhere to the standards outlined below.

---

## 1. Developer Philosophy & Senior Engineer Workflow

### A. "Explain First, Code Second" (Architecture & Approval Rule)
- **Always Explain First**: Before modifying or creating code, clearly outline the diagnostic findings, architectural design, data flow, and trade-offs.
- **Seek User Approval**: Present architectural proposals, API contracts, or UI flow changes to the user for alignment before making code edits.
- **Senior Engineer Mindset**: Think systemically about scale, security, rate limiting, state management, and edge-case resilience. Avoid superficial quick-patches that mask underlying symptoms.

### B. Code Quality & Technical Standards
- **Clean & Modular**: Keep components focused, re-usable, and self-contained. Avoid monolithic 1000-line client components; split into clean sub-components or utility hooks.
- **Robust Error Handling & Defensiveness**: Verify property definitions and non-null states before dereferencing (`user?.email`, `profile?.role`). Never swallow exceptions or return silent dummy fallbacks without logging root causes.
- **Zero Build Regression Guarantee**: Every task MUST be verified cleanly using `npx tsc --noEmit` and `npm run build` with zero TypeScript or Next.js build errors.

---

## 2. Design System Principles (Claymorphism & Visual Excellence)

The YMUTE UI is built around a modern **Claymorphic & Glassmorphic Design System**. Interfaces must wowed the user at first glance with rich depth, soft 3D elevation, curated colors, and dynamic micro-interactions.

### A. Color Palette & Aesthetics
- **Deep Navy (Brand Primary)**: `#183153` (Tailwind `bg-navy`, `text-navy`, `border-navy/10`)
- **Metallic Gold (Brand Accent)**: `#CDA333` (Tailwind `bg-primary`, `text-primary`, `border-primary`)
- **Background Light**: `#F7F9FC` (Tailwind `bg-background-light`)
- **Glassmorphism**: `bg-white/80 backdrop-blur-xl border border-primary/10`

### B. Claymorphic Utility Tokens
- **Clay Cards**: `.clay-card` (Soft 3D shadow inset/outset elevation with rounded 2xl/3xl corners)
- **Clay Inputs**: `.clay-input` (Inset shadow fields with focus rings: `w-full h-14 rounded-2xl clay-input px-6 text-navy font-semibold`)
- **Clay Buttons**: `.clay-button-primary` (Elevated 3D buttons with hover scale and press depression: `transition-transform hover:scale-[1.02] active:scale-[0.98]`)

### C. Visual Feedback & Content-Scoped Responsiveness
- **Instant Interactive Feedback**: When an action occurs, the UI must provide clear feedback.
- **Content-Scoped Loader (`LogoLoader`)**: Use the liquid-filling vector microphone loader (`components/ui/LogoLoader.tsx`) inside content panels (`<main>`). **Never blur or block sidebars (`<aside>`) during tab switches.** Sidebars must remain 100% sharp, responsive, and functional.
- **Vector Assets Only**: Use scalable SVG vector assets (`/logo-icon.svg`, `/logo-text.svg`, `/logo-full.svg`). Avoid raster PNGs for UI logos.

---

## 3. Architecture Patterns & Code Guidelines

### A. Next.js 16 App Router & React 19 Patterns
- **Server vs Client Components**: Keep pages as Server Components where possible; use `"use client"` only at component leaves that require interactive state or event listeners.
- **Suspense Boundaries**: Wrap dynamic search params (`useSearchParams()`), dynamic routing, or heavy client components in `<Suspense>` to ensure static prerendering compliance.
- **Route Navigations**: Use standard Next.js `<Link>` and `router.push()` without forcing artificial, blocking global delays.

### B. Supabase Auth & Session Management
- **Cookie Chunking**: Supabase `@supabase/ssr` chunked auth cookies (`sb-*-auth-token.0`, `sb-*-auth-token.1`) MUST be checked using `c.name.includes("auth-token")` in Next.js middleware (`middleware.ts`).
- **Complete Logout Purging**: Logout actions MUST execute server-side cookie deletion via `/api/auth/logout`, clear `document.cookie` client-side, reset auth context state, and redirect cleanly to `/login`.

### C. Security & Rate Limiting
- **Dual-Layer Rate Limiting**: Sensitive endpoints (Auth, OTP, Password Resets, Uploads, Chat) MUST enforce sliding-window IP rate limiting via `lib/rate-limiter.ts`.
- **OTP Hashing**: Store 6-digit verification OTPs as SHA-256 hashes (`crypto.createHash('sha256')`). Never store plaintext OTPs.
- **Dual-Layer Fallback**: Use `lib/otp-store.ts` for memory + database session persistence to ensure 100% uptime even during database schema refreshes.

### D. Database Migration Rule (CLI Deployment Only)
- **Versioned Migration Files**: All future database schema modifications, table creations, column additions, or RLS policy updates MUST be saved as timestamped `.sql` files under `supabase/migrations/` (e.g. `YYYYMMDDHHMMSS_description.sql`).
- **CLI Deployment**: All database migrations will be pushed programmatically via the Supabase CLI (`npx supabase db push`). Never perform unversioned manual edits in the browser SQL editor without committing a corresponding migration file.

---

## 4. Pre-Flight Checklist Before Declaring Task Completion

1. [ ] **Explained & Approved**: Was the architectural plan explained to and approved by the user first?
2. [ ] **Claymorphic Styling**: Does the UI adhere to Claymorphism (`clay-card`, `#183153` Navy, `#CDA333` Gold, smooth hover/active scaling)?
3. [ ] **Content-Scoped Feedback**: Are loading states scoped to the content area without blurring sidebars?
4. [ ] **TypeScript Check**: Did `npx tsc --noEmit` exit with 0 errors?
5. [ ] **Next.js Production Build**: Did `npm run build` generate all static and dynamic pages successfully?
6. [ ] **Database Migration File**: If DB schema changed, is there a timestamped `.sql` file in `supabase/migrations/`?
