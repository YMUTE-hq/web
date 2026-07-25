# YMUTE - Developer Guide & Technical Documentation

This document serves as a complete technical guide for the YMUTE project. It covers the system architecture, project structure, database schema, third-party integrations, and deployment instructions to help developers understand, run, and scale the platform.

---

## SECTION 1 — PROJECT OVERVIEW

**YMUTE** is a fully functional voice marketplace built to connect talented voice actors ("Casters") with businesses and creators ("Companies"). It also features a community aspect where users can engage, share, and track leaderboards.

The platform bridges three primary user types:
- **Casters**: Voice talent looking for jobs. They showcase their portfolios, upload voice reels, and apply to job postings.
- **Companies**: Businesses or creators who need voice acting services. They can post jobs, review caster applications, and hire talent.
- **Community Users**: General users who participate in the forums, prediction games, and view the talent roster.

### Core Marketplace Flow:
1. **Job Posting**: A Company creates a structured job post detailing domain, language, budget, and requirements.
2. **Exploration**: A Caster browses the `/jobs` marketplace to find suitable opportunities.
3. **Application**: The Caster applies to a job, submitting a customized message.
4. **Hiring**: The Company reviews the applicant's profile (including cloud-hosted audio reels) and accepts the application, successfully hiring the caster.

---

## SECTION 2 — SYSTEM ARCHITECTURE

YMUTE uses a modern, serverless architecture centered around Next.js and Supabase.

### Architecture Layers:
- **Frontend**: **Next.js (App Router)** built with React and styled with Tailwind CSS. It handles all client-side rendering, routing, and UI state.
- **Backend APIs**: **Next.js API Routes** (`app/api/`) act as the secure backend, orchestrating database transactions and third-party interactions.
- **Database**: **Supabase PostgreSQL** provides a highly scalable relational database.
- **Authentication**: **Supabase Auth** manages secure user signups, logins, and session persistence.
- **Media Storage**: **Cloudinary** handles the storage and delivery of user-uploaded media (voice reels and company logos).
- **Email Service**: **Resend** is used for transactional emails, such as notifying users when they receive or are accepted for a job application.

### Data Flow Diagram (Conceptual):
```text
[ User / Browser ] 
       │ 
       ▼ (HTTP Request)
[ Next.js Frontend ] ───▶ [ Next.js API Routes (`/api/...`) ]
       │                               │
       │                               ├──▶ [ Supabase Database (PostgreSQL) ]
       │                               │
       │                               ├──▶ [ Cloudinary API (Media Uploads) ]
       │                               │
       └───────────────────────────────┴──▶ [ Resend API (Transactional Emails) ]
```

---

## SECTION 3 — PROJECT STRUCTURE

The codebase is organized using the standard Next.js App Router conventions:

- **`app/`**: Contains the core application routes, layouts, and API endpoints. Each directory (e.g., `app/dashboard/caster`) corresponds to a URL path. `layout.tsx` files provide shared UI wrappers (like navigation and footers) to nested pages.
- **`app/api/`**: Contains all server-side logic in `route.ts` files. For instance, `/api/applications` handles creating and updating job applications securely.
- **`components/`**: Houses reusable UI components to keep code DRY. Examples include the `Navbar`, `Footer`, and `NotificationBell`.
- **`lib/`**: Contains utility files and integration clients. Key files include `supabase-server.ts` for server-side Supabase operations, `cloudinary.ts` for media uploads, and `resend.ts` for email utilities.
- **`supabase/`**: Contains the `schema.sql` file which acts as the single source of truth for the entire database architecture and security policies.

---

## SECTION 4 — DATABASE SCHEMA

YMUTE relies on a relational PostgreSQL database hosted on Supabase. Below are the core tables and their purposes:

- **`users`**: Extends the default Supabase authorization table. Stores user profiles, roles (`caster`, `company`, `user`), bio, languages, domains, and Cloudinary media URLs.
- **`jobs`**: Stores job postings created by companies. Includes title, budget, requirements, and links to the `company_id`.
- **`applications`**: A junction table linking a Caster to a Job. Tracks the applicant's message and the application `status` (pending, accepted, rejected).
- **`payments`**: Tracks the transaction history between casters and companies, linking to both the job and the specific caster.
- **`ratings`**: Allows users and companies to leave 1-5 star reviews on caster profiles.
- **`notifications`**: Stores in-app alerts (e.g., "Your application was accepted") and tracks read status.
- **`leaderboard`**: Tracks points and ranks for community users participating in platform games and activities.

### Data Protection via Row Level Security (RLS)
The database is heavily protected by Supabase RLS. Only authorized users can interact with specific data rows. For example:
- A Company can only UPDATE job records they created.
- A Caster can only SELECT their own applications or view their own payment history.
- The `users` table auto-populates upon signup using a PostgreSQL trigger (`handle_new_user()`).

---

## SECTION 5 — AUTHENTICATION SYSTEM

Authentication natively utilizes **Supabase Auth**.

### Supported User Roles:
1. **`caster`**: Voice talent seeking work.
2. **`company`**: Businesses posting jobs.
3. **`user`**: General community users.
4. **`admin`**: Platform administrators evaluating standard content.

### Role-Based Redirection
When a user signs in, the application evaluates their role stored in the database.
- The `middleware.ts` file acts as a global guard, restricting unauthenticated requests to `/dashboard/*` routes and redirecting them to the `/login` page.
- Upon successful login, the frontend logic pushes:
  - Casters to: `/dashboard/caster`
  - Companies to: `/dashboard/company`
  - Standard users to the homepage (`/`) or `/community`

---

## SECTION 6 — MARKETPLACE FEATURES

The core of YMUTE operates through distinct, interconnected modules:

- **Job Marketplace (`/jobs`)**: Reads open jobs from the `jobs` table. Includes sorting and filtering capabilities allowing Casters to find matched gigs.
- **Talent Discovery (`/explore-talent`)**: A public directory pulling from the `users` table where `role='caster'`. Companies can filter talent by language, domains, and aggregated ratings.
- **Application System**: Tied to the `applications` table. It ensures a Caster can only apply to a job once (enforced by a unique database constraint). 
- **Hiring Flow**: Handled by Company users. When an application's status is patched to `accepted` via the API, the backend updates the database and triggers subsequent actions like email notifications.

---

## SECTION 7 — DASHBOARDS

Dashboards are heavily protected routes providing user-specific management capabilities.

### Caster Dashboard (`/dashboard/caster`)
- **Applications**: Track the status (pending, accepted, rejected) of applied jobs.
- **Profile Management**: Update bio, location, languages, and specific voice acting domains.
- **Voice Reels**: Upload and manage audio references that companies will use to evaluate their voice.
- **Payments**: Track completed jobs and earned revenue.

### Company Dashboard (`/dashboard/company`)
- **Post Job**: Create new postings that immediately appear in the public marketplace.
- **Manage Jobs**: Edit details or close active postings.
- **Review Applications**: View applicants for specific jobs, listen to their audio reels, and make hiring decisions.
- **Hire Casters**: Accept applications, which solidifies the connection between the company and the caster.

---

## SECTION 8 — THIRD PARTY INTEGRATIONS

YMUTE relies on three specialized external services:

1. **Supabase**: Handles PostgreSQL database hosting, row-level security, and JWT-based authentication. The integration leverages both `@supabase/ssr` (for middleware/server) and `@supabase/supabase-js`.
2. **Cloudinary**: Responsible for media storage. Configured in `lib/cloudinary.ts`. Used primarily when Casters upload audio reels and Companies upload corporate logos, ensuring fast media delivery via CDN.
3. **Resend**: A developer-first email API mapped in `lib/resend.ts`. Used systematically by API routes to send transactional emails (e.g., notifying a Caster that a Company viewed or accepted their application).

---

## SECTION 9 — ENVIRONMENT VARIABLES

The project requires specific environment variables to function locally and in production. These reside in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: The public URL of the Supabase project. Required by the frontend client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anonymous key for Supabase, safe to expose to the browser.
- `SUPABASE_SERVICE_ROLE_KEY`: A highly privileged backend key used within `app/api/` routes to bypass RLS when performing admin-level tasks (e.g., automatic trigger actions).
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary account identifier.
- `CLOUDINARY_API_KEY`: The public key for Cloudinary integrations.
- `CLOUDINARY_API_SECRET`: The secret key for securely uploading media from the server.
- `RESEND_API_KEY`: The API key generated from your Resend dashboard for dispatching emails.
- `NEXT_PUBLIC_APP_URL`: The base URL of the application (`http://localhost:3000` in development, or the Vercel domain in production). Used for constructing absolute redirect links.

---

## SECTION 10 — LOCAL DEVELOPMENT SETUP

Follow these steps to run YMUTE locally:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory duplicating `.env.local.example` and fill in the required keys outlined in Section 9.

3. **Setup Supabase Database**
   - Access your Supabase dashboard and open the SQL Editor.
   - Copy the entire contents of `supabase/schema.sql`.
   - Run the script to generate all required tables, triggers, and RLS policies.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the site.

---

## SECTION 11 — DEPLOYMENT GUIDE

The YMUTE stack is heavily optimized for zero-config deployment using modern PaaS providers.

- **Frontend Hosting (Vercel)**: 
  Push the code to GitHub and import the repository into Vercel. Vercel natively supports the Next.js App router and handles Edge network caching automatically.
- **Database (Supabase)**: 
  Ensure your remote Supabase instance is live and that you have executed `supabase/schema.sql` on the production database.
- **Media & Email**: 
  Ensure Cloudinary and Resend API credentials are valid and out of "sandbox" mode if necessary.
- **Environment Variables**: 
  Crucially, copy all keys from `.env.local` into your Vercel project's Environment Variables settings before triggering the first production build. Set `NEXT_PUBLIC_APP_URL` to your live domain.

---

## SECTION 12 — FUTURE IMPROVEMENTS

As the platform scales, the following technical enhancements should be considered:

- **Stripe Payment Integration**: Transition from tracking `amounts` in a table to actual escrow and ledger routing utilizing Stripe Connect.
- **Real-Time Notifications**: Leverage Supabase Realtime subscriptions in the frontend to update the `NotificationBell` instantly without page reloads.
- **AI Voice Analysis**: Implement auto-tagging or transcription for uploaded audio reels using an AI API (like OpenAI Whisper) to enrich talent discovery filters.
- **Mobile Application**: Wrap the Next.js PWA using Capacitor or create a standalone React Native app bridging the same Supabase backend.
