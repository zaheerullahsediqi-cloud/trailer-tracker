# Trailer Tracker

Tracks trailers, renters, rental terms, contract PDFs, and sends automatic email
reminders + invoices. Works on phone and computer (it's a normal website).

## What it does
- Add trailers (VIN, make, model, year, plate)
- Add renters (name, address, phone, email)
- Create a rental linking a trailer + renter + start date + billing period + rate
- Upload the signed contract PDF to each rental
- Dashboard shows overdue / due-soon / upcoming rentals
- One-click "Email invoice to renter" — generates a branded PDF invoice and emails it
- Daily automatic check emails **you** a summary whenever something is due within 3 days or overdue — no phone notification needed, it lands in your inbox

## One-time setup (about 20-30 minutes)

### 1. Create a Supabase project (free tier is fine)
1. Go to supabase.com → New project. Name it `trailer-tracker`.
2. Once it's created, go to **SQL Editor → New query**, paste the entire contents
   of `supabase/schema.sql` from this project, and click **Run**. This creates all
   your tables and a private storage bucket for contracts.
3. Go to **Authentication → Users → Add user**. Create yourself a user with your
   email and a password — this is your login for the app (single user, as you asked).
4. Go to **Project Settings → API**. Copy:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click reveal) → this is `SUPABASE_SERVICE_ROLE_KEY`
     (keep this one secret — never put it in the browser code)

### 2. Create a Resend account (for sending emails)
1. Go to resend.com → sign up (free tier covers ~3,000 emails/month).
2. Go to **API Keys → Create API Key** → copy it → this is `RESEND_API_KEY`.
3. Go to **Domains → Add Domain** and verify a domain you own (adds a couple DNS
   records — same idea as when you verified your domain for Kohinoor's site).
   Once verified, pick an address like `invoices@yourdomain.com` for
   `INVOICE_FROM_EMAIL`. (If you don't want to verify a domain yet, Resend lets
   you send from `onboarding@resend.dev` for testing only.)

### 3. Upload this project to GitHub
Same drag-and-drop flow you used for the Kohinoor site and the trailer SaaS:
1. Go to github.com → New repository → name it `trailer-tracker` → Create.
2. Open **GitHub Desktop** → File → Add Local Repository → select this folder.
3. Commit and Publish repository.

### 4. Deploy on Vercel
1. Go to vercel.com → New Project → Import the `trailer-tracker` repo.
2. Before clicking Deploy, open **Environment Variables** and add all of these
   (values from steps 1-2 above):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `INVOICE_FROM_EMAIL`
   - `COMPANY_NAME` (e.g. `Star Link Freight Inc.`)
   - `OWNER_EMAIL` (your email — where daily due-date summaries go)
   - `CRON_SECRET` (make up any random long string, e.g. `sk-trailer-9f8e...`)
3. Click **Deploy**. Vercel automatically reads `vercel.json` and schedules the
   daily reminder check — nothing extra to configure.
4. Once deployed, open the URL Vercel gives you, log in with the Supabase user
   you created in step 1.3, and start adding trailers.

## Using it day to day
- **Dashboard** (home page): shows every active rental sorted by urgency.
- **Trailers / Renters**: add your fleet and your renters once.
- **Rentals → Create rental**: pick trailer + renter + start date + rate +
  billing period (weekly/monthly/custom days). The "next due date" is
  calculated automatically.
- Open a rental to:
  - Upload the signed contract PDF
  - Preview or download the invoice PDF
  - Email the invoice to the renter directly (uses the renter's email on file)
  - "Mark period paid → advance due date" once you've been paid, to roll the
    due date forward to the next billing cycle

## About the reminder emails
Every day at 8am Central, the app checks for rentals due within 3 days or
overdue, and emails **you** (not the renter) a summary at `OWNER_EMAIL`, so you
never lose track of a trailer. To change the time, edit the `schedule` in
`vercel.json` (it's in UTC — cron format is `minute hour * * *`) and push the change.

## About WhatsApp
You chose to skip WhatsApp integration for now — invoices go out by email, and
you can always download the invoice PDF from a rental page and send it manually
via WhatsApp Web. If you want automatic WhatsApp sending later, this can be
added with Twilio's WhatsApp API — just let me know and I'll wire it in.

## Local development (optional)
If you want to run it on your own computer first:
```
npm install
cp .env.example .env.local   # fill in the same values as above
npm run dev
```
Then open http://localhost:3000
