# YMUTE - The Voice Marketplace

YMUTE is a fully functional Next.js application that serves as a premier voice caster marketplace, allowing casters to showcase their portfolios, companies to post casting jobs, and users to engage in a community-driven ecosystem.

## 🚀 What Has Been Done

The complete frontend and backend architecture has been established, bridging the original Stitch HTML designs to a dynamic, functional Next.js framework:

1. **Authentication & User Roles**
   - Full Supabase Auth integration.
   - Separate multi-step signup flows for **Casters** and **Companies**.
   - Intelligent role-based redirection protecting dashboard routes.

2. **Database Architecture (Supabase)**
   - Unified `users` schema containing role-specific data alongside `jobs`, `applications`, `payments`, `ratings`, `notifications`, and `leaderboard` tables.
   - Comprehensive Row Level Security (RLS) policies protecting user data.
   - Automated database triggers for profile creation upon signup.

3. **Core Marketplace Features**
   - **Job Board (`/jobs`)**: Dynamic listing of open jobs with filtering and search.
   - **Talent Discovery (`/explore-talent`)**: Searchable roster of casters with filterable domains, languages, and ratings.
   - **Application System**: Casters can apply directly to jobs; Companies can accept/reject them, triggering an auto-rejection for competing applicants.

4. **Dashboards**
   - **Company Dashboard**: Manage job postings, review applications, and hire casters.
   - **Caster Dashboard**: Track applications, view earned payments, and manage public profile (bio, languages, voice reel).

5. **Community & Engagement**
   - **Notification System**: Real-time dropdown bell alerting users of application statuses.
   - **Community Hub (`/community`)**: Forums and leaderboards for networking.
   - **Games Page (`/games`)**: Prediction challenges and quizzes for the community.

6. **Third-Party Integrations**
   - **Cloudinary**: Fully implemented for uploading caster audio voice reels and company logos.
   - **Resend**: Configured for sending email alerts conditionally when applications are submitted or hired.

---

## ⏳ What is Left

The codebase structure is practically 100% complete, but a few manual setup items remain before the platform is production-ready:

1. **Environment Configuration**
   - You must populate the `.env.local` file with your actual API keys (Supabase, Cloudinary, Resend) for the integrations to work.
2. **Community/Games Interactive Logic**
   - The UI for `/community` and `/games` is built, but you may want to wire up the actual backend logic for submitting new posts, calculating prediction scores, and updating the leaderboard dynamically.
3. **Payment Processor**
   - If you want the platform to handle actual monetary transactions (rather than just tracking `amount` in the database), a tool like **Stripe** needs to be integrated into the hiring flow.
4. **Deployment**
   - Deploying Next.js frontend to **Vercel**.
   - Ensure the Supabase database migrations are applied in your remote Supabase project.

---

## 🛠 Installation & Setup Guide

Follow these steps to run the YMUTE platform locally:

### 1. Install Dependencies
Ensure you have Node.js installed. In the root of the project (`ymute-app`), install all required NPM packages:
```bash
npm install
```

### 2. Configure Environment Variables
Rename the `.env.local.example` file to `.env.local` (or create a new `.env.local` file).
Fill in the placeholders with your actual project keys from your dashboards:
```ini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Copy the entire contents of `supabase/schema.sql` located in this project.
4. Run the SQL script. This will create all the necessary tables, triggers, and security policies.

### 4. Run the Development Server
Start the local Next.js server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application is now running with the complete UI and backend integrations active!
