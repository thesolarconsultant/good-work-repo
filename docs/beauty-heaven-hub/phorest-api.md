# Phorest API: can it connect to what we are building?

**Status: read from Phorest's public developer docs on 2026-09-30. Nothing has been called, because we
have no credentials yet.** Source: `developer.phorest.com` (index at `/llms.txt`, pages also served as `.md`).

## Verdict

**Yes, technically, and it covers what the proposal promised.** Two gates decide when: Phorest has to
issue access, and the docs do not say what it costs.

## How access works

- **Phorest support issues the credentials on request.** The request must come from an email address
  associated with the business in Phorest, and include the **Phorest account number**. Jess or the
  Phorest administrator has to send it; we cannot.
- **HTTP Basic auth.** Username looks like `global/<email>`, plus a password, on the **EU server**
  (`api-gateway-eu.phorest.com/third-party-api-server`).
- **The API is live.** Calls act on real salon data immediately. The docs mention no sandbox.
- **Rate limit 100 requests per second.** More than enough. **No webhooks documented**, so polling. (An FAQ
  entry mentions purchase events arriving over SQS for one customer. Ask Phorest whether an event feed is offered.)
- **Not stated anywhere:** cost, plan requirements, turnaround. Ask.

## What it can do for us

| Our piece | Phorest endpoints | Notes |
|---|---|---|
| **Website menu** | List branch services, service categories | Returns `name`, `price`, **`duration`**, **`internetDescription`** and `internetEnabled`, so we may not need to ask for durations or treatment copy. There are also per-practitioner prices and durations. |
| **Website team** | List staff | Returns `onlineProfile` (a bio), `imageUrl`, `selfEmployed` and `hideFromOnlineBookings`. |
| **Website booking** | **Embed Phorest's own booking button or widget (no API needed)**, or the Booking and Availability APIs for a custom flow | The docs call a bespoke flow "often very expensive and time-consuming" and recommend the embed. |
| **Voice agent** | List clients (filter by **phone**), list appointment availabilities, create, cancel and activate booking, booking notes | The docs list caller lookup for phone systems as a standard use case. |
| **WhatsApp assistant** | Same booking endpoints, plus **create a lead** | |
| **Deposits** | **Create a deposit payment link** | Amount comes from the branch's deposit settings. |
| **Email and newsletter** | Client records carry `emailMarketingConsent` and `smsMarketingConsent`, and client categories | We can respect consent and add newsletter signups. |
| **Console** | List reviews | Real reviews as content ideas. |
| **Academy** | Courses and client courses, vouchers, packages | Not yet looked at in detail. |
| **Vouchers** | Create and list vouchers | |

Bookings can be `ACTIVE` or `RESERVED`. A reserved booking holds a slot until activated, which suits taking a deposit first.

## What it cannot do

- **No card payments or Phorest Pay.** It can create a deposit payment link. It cannot take card details.
- **No SMS or email sending found** in the endpoint index. So "SMS runs through Phorest" holds, and the proposal wording is right.
- **No image upload.** Irrelevant for now.
- **Shopify not supported.** Not needed.

## Risks to manage

- **Live data.** A bug in the voice agent writes to the real diary. Build behind a "reserved, needs confirming" state first, and test against a dedicated test client.
- **Personal data.** The staff endpoint includes birth date, tax number, payroll number, mobile and email. The client endpoint carries contact details and consents. **Request and store only the fields we need.** Never pass client records to an AI model beyond what one call requires. This needs a data-processing agreement with the client, and the privacy policy updated.
- **Consultation rules.** No API field says which services need a consultation first. Those rules come from Jess and Hollie.

## What this changes

- **The website is not blocked on the API.** Start on the embedded booking widget, and the menu and team can be filled in from the API once access arrives.
- **The voice agent and chatbot are blocked on access.** Ask for it now.
- **Some questions may answer themselves.** Durations, treatment descriptions and team bios may already be in Phorest. Check before asking again.

## Email to send (from the address Phorest holds for the business)

> **Subject:** API access request: Beauty Heaven Hub, account [ACCOUNT NUMBER]
>
> Hi Phorest team,
>
> We would like to request Third Party API access for Beauty Heaven Hub (Phorest account number [ACCOUNT NUMBER]; booking page phorest.com/book/salons/beautyheaven1).
>
> Our developer partner, Good Work, will use it to connect our new website, phone assistant and messaging assistant to our diary: reading services, staff and availability, looking up clients by phone number, and creating and cancelling bookings.
>
> Could you please:
> 1. Issue API credentials for the EU server.
> 2. Tell us whether API access is included in our plan or has a cost.
> 3. Confirm whether a test or sandbox environment exists.
> 4. Confirm whether an event or webhook feed is available for new bookings and cancellations.
> 5. Share the current instructions for embedding the online booking button on a new website.
>
> Thank you,
> [Name]

---

## Triggered email: what Phorest lets us detect

Read from the API spec on 2026-10-01. **Not tested**, because we have no credentials.

Phorest has **no webhooks in its docs**, so triggers work by **polling for what changed**:

- **Appointments** can be listed with `updated_from` / `updated_to`, `from_date` / `to_date`, `client_id`, and `fetch_canceled`.
  Each has `state` (`BOOKED`, `CHECKED_IN`, `PAID`), `activationState` (`RESERVED`, `ACTIVE`, `CANCELED`),
  `createdAt`, `updatedAt`, `serviceName`, `serviceId`, `clientId`, `confirmed`, and `depositAmount`.
- **Clients** can be listed with `updatedAfter` / `updatedBefore`, `email`, `phone`. Each has `clientSince`,
  `firstVisit`, `lastVisit`, `emailMarketingConsent`, `smsMarketingConsent`, and `clientCategoryIds`.

The API returns current state, not events. To spot a transition (for example `CHECKED_IN` to `PAID`), we keep
the last state we saw, so we need a small database. The same store records what we have already sent, which
stops duplicates.

| Trigger | How we spot it | Email |
|---|---|---|
| New client | `clientSince` recent, nothing sent before | Welcome |
| Treatment finished | Appointment `state` becomes `PAID` | Aftercare for that treatment, then a review request a few days later |
| Annual top-up due | `PAID` semi-permanent appointment about 11 months ago (Phorest lists "Annual Top Up" at £140) | Top-up reminder |
| Lapsed client | `lastVisit` older than N months | Re-engagement (**needs marketing consent**) |
| Cancellation | `activationState` becomes `CANCELED` | Rebooking nudge |

`PAID` means paid at the till, which is close to "treatment finished" but not the same thing.

### Rules

- **Marketing-type emails go only to clients with `emailMarketingConsent: true`.** Aftercare with no promotion
  is service information, but keep it clean. Every marketing email carries an unsubscribe that **writes back**
  to Phorest. The client update endpoint exists. **Confirm the consent fields are writable before promising this.**
- **Phorest's own automated emails keep sending unless switched off.** Replacing one means disabling the
  Phorest version, or the client gets both. Keep Phorest's reminders and confirmations if they carry
  confirm, cancel or reschedule links (**check that they do**).
- **Whether Phorest offers an event feed** (the FAQ hints at one) would replace polling with instant triggers.
  It is already asked in the access-request email.
- **Scope:** define a fixed set of automations in the build (welcome, aftercare, review request, top-up
  reminder). Extra flows and campaign content sit under GOOD GROWTH.

### Templates

Our welcome email is table-based with inline styles and Outlook conditionals, so it survives real email
clients. Its merge tags are **GoHighLevel syntax**, but Beauty Heaven uses Phorest, so they need remapping to
whichever sender we choose. It has no dark-mode support yet.

---

## Keeping everything matched to Phorest

**Principle: Phorest is the single source of truth.** Our systems never own diary or client data. They read it
from Phorest and write changes back into it.

1. **Read live, don't copy.** Availability and client details are fetched at the moment they are needed (the call,
   the chat, the send). Menu, prices and staff on the website are pulled from Phorest and cached only briefly.
   If Phorest is unreachable, the site shows the last known version and the booking link, and the agent takes a
   message. It never guesses.
2. **Write through, then verify.** Bookings the voice agent or chatbot makes go into Phorest through the Booking
   API. We re-read the appointment before telling anyone "you're booked". A held slot is `RESERVED` until
   confirmed. The booking note is tagged with its source. If a write fails, the agent says so and hands over.
3. **Store almost nothing, and key it by Phorest IDs.** We keep a "last checked" marker, a log of what was sent
   (client ID, appointment ID, which email), and nothing else. Names and emails are read fresh at send time, so a
   change made at the front desk is picked up automatically.
4. **Re-check at send time.** Polling only says "this might need an email". Immediately before sending we
   re-fetch the appointment and the client, and skip if the state has moved (cancelled, deleted, no longer
   `PAID`), or the client is archived, deleted, `banned` or no longer consenting. If the client has been merged,
   follow `mergedToClientId`. These fields all exist on the records.
5. **One owner for consent.** Phorest owns it. We read it at send time and write unsubscribes straight back. If
   a write-back fails, we suppress locally and retry, and lean towards not sending.
6. **Nightly reconciliation.** Compare our send log and agent-made bookings against Phorest, and email us a short
   drift report. Also run a small test against the read endpoints, and watch Phorest's changelog (the API is at
   version 1.35.0), so a breaking change is spotted early.
7. **UK time.** Store UTC, show Europe/London, and test across a clock change.
8. **Records carry a version number**, which we use so we never overwrite a change made at the desk.
   **Confirm how the update endpoints use it.**

### Going live safely (the API is live and has no sandbox)

- **Dry-run first.** For a week the job reads real data and logs what it *would* send. Nothing is sent.
- **A switch per automation**, so any one can be paused instantly.
- **A dedicated test client** for anything that writes to the diary.
- **The agent only books what Phorest marks bookable online** (`internetEnabled`) and follows the consultation rules.

---

## Online booking today, and how the website should link to it

Read from the live booking page and Phorest's help centre on 2026-10-01. **Read-only. Nothing was booked and no
details were entered.**

- **Their page:** `https://www.phorest.com/salon/beautyheaven1`. The Phorest subdomain is **`beautyheaven1`**.
- **The flow a customer sees:** one long list of all **33 categories** with the services inside, then **Select
  Staff**, then date and time. Choosing *Dermal Fillers > Consultation* offers only **Hollie**, **Jessica** or "no
  preference", so online consultations for fillers appear to be with those two. **Confirm with them.**
- **Floating "Book Now" widget:** a two-line snippet, `new OBWidget('beautyheaven1')`. **It works on desktop only.
  On mobile it opens Phorest's page in a new tab.** Their brand colour and the widget colour are set under
  Manager > Settings > Online.
- **iFrame embed:** possible, but Phorest itself recommends against it.
- **Direct links exist** for a service (copied from Manager > Services > Online & App), a **category**
  (`https://www.phorest.com/salon/beautyheaven1/book/categories/<categoryID>`), a package, an offer, a product
  and a **staff member**.
- **The booking page itself is hosted by Phorest.** The only styling we control is the brand colour.

### What that means for the site

1. **Send people to the right place, not the bare booking page.** Every treatment page gets "Book this
   treatment" pointing at its category or service link. Every team page points at that person's link. This skips
   the 33-category list, which is long and awkward on a phone.
2. **Use our own buttons, not the floating widget.** Most clicks come from phones, and on a phone the widget just
   opens a new tab anyway. Our buttons behave the same everywhere.
3. **Set Phorest's brand colour to match the site**, since it is the only control we get.
4. **Category IDs can be listed through the API** once we have access. Until then they have to be read from
   Manager. Service links can only be copied one at a time, so start with the 33 categories and around ten
   headline services.
