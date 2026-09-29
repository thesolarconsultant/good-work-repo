# Beauty Heaven Hub: receptionist and consultation lead (plan)

One assistant, three doors: the phone, WhatsApp, and (later) the website chat. It has one brain and one set of rules,
and it reads and writes the diary in Phorest. It is a receptionist and a consultation lead, not a clinician.

## Where a client books today (to be confirmed by the interview, Part B)
- Phorest online booking (hosted page, `beautyheaven1`), for treatments marked bookable online.
- Phone to the front desk (assumed, not yet confirmed).
- Walk-ins, and Instagram or WhatsApp messages (assumed).
- Many treatments cannot be booked online, including the anti-wrinkle and semi-permanent consultations, so those go
  through a person today.

## What the assistant does
1. **Answers** from one source of truth: the 473-service master list (prices, durations, online yes/no), the team, the
   T&Cs, deposits and cancellation rules, aftercare, location and hours. It says "I'll check" rather than guess.
2. **Books** simple treatments: looks up the caller by phone number, reads live availability, holds the slot as
   `RESERVED`, takes or sends the deposit link, activates it, then re-reads the appointment before saying "you're booked".
3. **Leads consultations:** asks what the client wants, explains the consultation step and fee, books the consultation
   (never the treatment) where a consultation is required, and passes the medical and consent forms on.
4. **Hands over to a person**, with a summary, for anything clinical, a complaint, a request it cannot verify, or a
   client who asks for a human. Out of hours it takes a message and promises a callback time only if the salon agrees one.
5. **Writes to Phorest** with a note tagged with its source ("phone assistant" or "WhatsApp"), so staff can see what
   it did.

## What it must not do
- Give medical advice, judge suitability, or promise results. Prescription-only treatments (anti-wrinkle, weight-loss
  pens): no advertising-style claims and no prices pushed unprompted, pending a check of the rules.
- Book anything Phorest does not mark bookable, or skip a consultation rule.
- Invent a fact. Unproven claims (for example "97% pass rate", "award-winning", "accredited") stay out until proven.

## Build order
1. Interview Part B answers, and the Phorest API access request (email drafted in `phorest-api.md`, sent by Jess).
2. WhatsApp first: the fastest to test and the lowest risk (text, easy to review, no call-recording question).
3. Voice second: needs the phone provider, call forwarding, and a decision on recording and disclosure.
4. Every step is switchable, starts in dry-run (it drafts, a person approves), and is reconciled nightly against Phorest.

## Blocking unknowns
Phorest API access and cost; the phone provider and whether calls can be forwarded; which treatments the assistant may
book unaided; the salon's location and hours (Hoddesdon vs Wombwell is unresolved); the opt-in state for WhatsApp.

## Two sides on WhatsApp (added 2026-10-01)
The same WhatsApp number fronts two different agents. They must never be able to reach each other's tools.
- **Clients** talk to the receptionist and consultation lead (above).
- **The owners and named staff** talk to an operator agent that runs the Content Console and the content agents (the
  proposal already says the team can feed the console "thirty seconds on WhatsApp"). Only numbers on an allowlist reach
  it. A client message can never be routed there, and anything a client sends is treated as text to read, never as an
  instruction to obey.
- The proposal covers a WhatsApp assistant that "routes people to the right person" and a console the team feed by
  WhatsApp. **Running all the content agents from chat is larger than that**, so it should be scoped and priced before
  it is promised.

## Pre-consultation photos and routing (idea, not yet scoped)
The assistant asks for photos and a short description, then sends the client to the right practitioner with a summary.
- **It collects and routes. It does not diagnose, judge suitability, or say a treatment is safe.**
- Photos of a client's face or body, with health details, are **health data under UK GDPR**. It needs a clear consent
  message before photos are requested, a stated purpose and retention period, storage where only the relevant
  practitioner can see them (not left in a WhatsApp thread, not fed into content or marketing), and deletion on request.
  Under-18s need a hard stop. Confirm the rules with the salon's insurer and a data-protection adviser.
- For prescription-only treatments the assessment and prescribing stay with the qualified practitioner.
- A photo request must never lead to an image being reused as content. Content uses generated or consented imagery only.

## The existing consultation app
The salon has been using an app that runs consultations of some kind. The user's view is that the practitioners should do
the consultation themselves. That is a fair choice, **but the records must still exist**: consent, medical history,
signatures and before-and-after photos, stored securely and retrievable. Before we replace or bypass the app we need to
know its name, what it stores, what it costs, and whether their insurer or prescriber expects it. Interview B13 to B14.

## Making money from the practitioners (commercial idea, to be decided by the owners)
Most practitioners are self-employed, and the salon does not earn from their treatments. Options to discuss, not yet
agreed or priced:
1. **A "hub membership" for each practitioner**: a monthly fee that includes a profile page, bookings from the site and
   assistant, and content support. Simple, predictable.
2. **A booking fee or share** on bookings the site and assistant bring in, set in writing.
3. **Content packages sold to practitioners** for their own pages and social posts.
4. **Consultation fees kept by the salon** (the £50 consultations): who keeps them today?
5. **Retail or Academy income** (courses, models) shared by agreement.
Two cautions. First, a fee tied to bookings, or the salon steering who gets which client, can change how a practitioner's
self-employed status looks to HMRC, so the salon should ask its accountant before it starts. Second, it must be opt-in,
in writing, and it is the salon's decision, not ours. Interview B15.

## What "a couple of API keys" leaves out (2026-10-01)
Keys are the easy part. The WhatsApp operator agent also needs:
- **A WhatsApp Business number on Meta's Cloud API** (or a provider such as Twilio), with business verification, a
  registered number, approved message templates, and the 24-hour reply-window rules for anything we start.
- **A server that receives the messages** (a webhook) and runs the agent. The user plans to set up a server.
- **A small database** for the staff allowlist, conversation state, approvals, and an audit log.
- **Safety controls:** allowlisted senders only, staff approval before anything is posted, a switch to turn each agent
  off, and a log of what it did.
- **Running costs:** WhatsApp conversation fees and model usage, on top of the platform fee.

## Where client photos would live
Flow: the assistant asks for consent and logs it, the client sends photos, our server downloads them straight away
(WhatsApp media links expire), stores them privately against that client, and tells the routed practitioner with a link.
Photos are never forwarded into staff WhatsApp chats or groups.
- **Google Drive:** fine only as a short pilot, on a business Google Workspace account (not personal Gmail) with 2-step
  sign-in, a shared drive, a folder per practitioner and link-sharing switched off. Weak on audit, easy to overshare,
  and deletion is manual.
- **Private storage plus a small staff page (recommended):** files in a private bucket, opened through short-lived
  links, per-practitioner access, an access log, and automatic deletion after a set time unless a consultation goes ahead.
- **Their consultation app or Phorest:** if the existing app or Phorest can hold photos on the client record, that may be
  the right home. Unknown; asked in interview B13 and B14.
