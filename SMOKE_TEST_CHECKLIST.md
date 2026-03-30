# Smoke Test Checklist (MVP Go-Live)

**Version:** 1.0  
**Date:** 2026-03-30  
**Environment:** Production-like (`NEXT_PUBLIC_*`, `OPENAI_API_KEY`, Supabase auth + DB configured)

---

## 1) Pre-flight

- [ ] App is reachable at target URL.
- [ ] `/login`, `/signup`, `/dashboard`, `/jurispudentie-search`, `/vraag-stellen` load without 5xx.
- [ ] Test inbox is available for magic-link emails.
- [ ] At least one known-good search query is ready (from `EXAMPLE_QUESTIONS.md`).

---

## 2) Auth Smoke Flow

### 2.1 Signup

- [ ] Go to `/signup`.
- [ ] Enter valid office/user details and submit.
- [ ] Expected:
  - [ ] Redirect to `/login?sent=1`.
  - [ ] Success message visible: magic link sent.
  - [ ] New firm/account row created in Supabase.

### 2.2 Login + Magic Link

- [ ] Go to `/login`.
- [ ] Enter existing account email and submit.
- [ ] Open email and click magic link.
- [ ] Expected:
  - [ ] Redirect lands on `/auth/callback`, then `/dashboard`.
  - [ ] No auth error banner shown.
  - [ ] User account chip shows account info.

### 2.3 Logout

- [ ] Open account menu in top-right avatar on dashboard.
- [ ] Click **Uitloggen**.
- [ ] Expected:
  - [ ] Redirect to `/`.
  - [ ] Re-entering `/dashboard` redirects back to `/login`.

---

## 3) Search + Answer Smoke Flow

### 3.1 Jurispudentie search (`/jurispudentie-search`)

- [ ] Run query: `Verjaring schadevergoeding stuiting aansprakelijkheid`
- [ ] Expected:
  - [ ] Results list renders.
  - [ ] Each item shows ECLI link.
  - [ ] No fallback garbage text appears (e.g. no "Geen snippet beschikbaar", no "Onbekende uitspraak").

### 3.2 Generate answer (`/jurispudentie-search`)

- [ ] Click **Genereer antwoord**.
- [ ] Expected:
  - [ ] Answer text appears.
  - [ ] Disclaimer appears above answer.
  - [ ] ECLI source chips appear under answer and are clickable.

### 3.3 Vraag stellen (`/vraag-stellen`)

- [ ] Ask a legal question (copy from `EXAMPLE_QUESTIONS.md`).
- [ ] Expected:
  - [ ] Search runs and answer appears.
  - [ ] Answer includes disclaimer.
  - [ ] Onderbouwing list contains ECLI links.
  - [ ] Source chips under answer are present when available.

---

## 4) Negative/Error Smoke Checks

- [ ] Empty search query shows user-friendly validation error (no stack trace).
- [ ] If OpenAI/Supabase is temporarily unavailable, user sees graceful Dutch error message.
- [ ] Oversized requests/files are rejected with safe message (413/400 paths).
- [ ] No raw HTML or internal payloads are shown to user on failures.

---

## 5) Browser + Mobile Sanity Matrix

Run sections 2 + 3 in each browser.

| Browser | Desktop | Mobile viewport |
|---|---|---|
| Chrome | [ ] Pass / [ ] Fail | [ ] Pass / [ ] Fail |
| Safari | [ ] Pass / [ ] Fail | [ ] Pass / [ ] Fail |
| Edge | [ ] Pass / [ ] Fail | [ ] Pass / [ ] Fail |

### Mobile viewport definition

- Use responsive mode or real device.
- Test at:
  - [ ] 390x844 (iPhone 12/13/14 class)
  - [ ] 360x800 (Android baseline)

### Mobile acceptance checks

- [ ] No horizontal overflow on dashboard/search/answer pages.
- [ ] Buttons remain tappable and visible.
- [ ] Input fields and result cards are readable without zoom.
- [ ] Account menu opens/closes correctly.

---

## 6) Ops Verification (post-smoke)

- [ ] `/api/ops/metrics` returns data with valid `x-ops-token`.
- [ ] Request count increases after smoke run.
- [ ] p95 latency/error rate are present.
- [ ] `openai` usage + estimated costs update after search/answer/document tests.
- [ ] No unexpected provider error spikes.

---

## 7) Sign-off

- **Tester:** ____________________
- **Environment:** ____________________
- **Date:** ____________________
- **Result:** [ ] PASS  [ ] FAIL
- **Notes / defects:** ____________________

