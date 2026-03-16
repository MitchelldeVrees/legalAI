# Supabase Contact Email Setup

This project now sends contact form submissions through a Supabase Edge Function:
- Next.js API route: `app/api/contact/route.js`
- Edge Function: `supabase/functions/contact-notify/index.ts`

## 1. Configure local app env (`.env`)

Add these variables to your local `.env`:

```env
SUPABASE_CONTACT_FUNCTION_NAME=contact-notify
CONTACT_INTERNAL_SECRET=replace-with-a-long-random-secret
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already used by the app.

## 2. Apply database schema change in Supabase

Run the updated SQL from `supabase_schema.sql` in the Supabase SQL editor.
It adds `public.contact_requests` for lead logging.

## 3. Set Supabase Edge Function secrets

Set secrets in your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set CONTACT_RECIPIENT_EMAIL=your@email.com
supabase secrets set CONTACT_FROM_EMAIL="LegalAI <onboarding@resend.dev>"
supabase secrets set CONTACT_INTERNAL_SECRET=replace-with-a-long-random-secret
```

Notes:
- `CONTACT_RECIPIENT_EMAIL` is where you will receive notifications.
- `CONTACT_INTERNAL_SECRET` must match your Next.js `.env` value.
- If you use a custom sender domain in Resend, update `CONTACT_FROM_EMAIL`.

## 4. Deploy the function

```bash
supabase functions deploy contact-notify
```

## 5. Test

Submit the form on `/contact`.

Expected behavior:
- Row is inserted into `public.contact_requests`.
- Notification email is sent to `CONTACT_RECIPIENT_EMAIL`.

If delivery fails, `/api/contact` returns `502` and logs `[contact-request-error]` in the server logs.
