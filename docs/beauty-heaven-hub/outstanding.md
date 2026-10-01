# Beauty Heaven Hub — outstanding questions and conflicts

**Status: live tracker.** Drawn from the discovery record
[`discovery-2026-10-01.md`](discovery-2026-10-01.md) on 1 October 2026. Keep it
updated as answers come in. Nothing here authorises changing live settings,
sending messages or switching on payments — the conflicts marked **blocks live
behaviour** must be confirmed by Jess or Hollie before the booking flow, the
assistants or the emails change.

Last reviewed: 2026-10-01 (updated with reception's B3–B9 answers, now in the
discovery record as Section 3).

---

## A. Conflicts to resolve

These are places where the record contradicts itself, contradicts the live
preview site, or leaves a rule too loose to build on. Each needs a decision
before the affected feature goes live.

| # | Conflict | What we have | Needs | Impact |
|---|----------|--------------|-------|--------|
| C1 | ~~**Booking-fee amount**~~ **DECIDED: £1.20** (Jordan, 1 Oct) | Three sources had disagreed (£1.20 meeting / £1.50 owner follow-up / £1.20 reception). Jordan confirmed **£1.20**, the current pre-authorised card hold charged on a no-show. The owner's "£1.50 on top" idea is **not** adopted. Nothing configured — no payment switched on. | Documented only. If the fee is ever surfaced on the site or reconfigured in Phorest, use £1.20 as a pre-auth. | resolved (not configured) |
| C2 | **Public hours vs Jessica's schedule** | Public close Tue/Thu 19:00; Jessica works an extra Tue/Thu 17:00–20:00 (finishes 20:00). | Confirm whether practitioners legitimately run past public closing, or this is a schedule mismatch. | blocks practitioner booking rules |
| C3 | ~~**Same-day bookings vs 48h forms**~~ **RESOLVED (reception)** | All treatments need a consultation **form** (checked in Phorest), not all need a face-to-face. The form is asked for before the appointment; if still incomplete 48h before, the client can complete it **on the day**. So a same-day booking is fine — the form just gets done on the day. | Done — fold into assistant/booking copy when built. | resolved |
| C4 | **"Late bookings on otherwise empty days"** | Jessica: treatments **over £85**; Hollie: **over £50**; ≥1h notice; assistant may confirm without asking. "Otherwise empty day" and "late" undefined; no rule authorises booking outside working hours. | Operational definition of "late" and "otherwise empty day". Note "over" means strictly over, not "at least". | blocks assistant auto-confirm rule |
| C5 | **Reminder vs cancellation window** | Reminder 48h before (seven-day idea withdrawn); cancellation cutoff also 48h, full price inside it or for a no-show. | Confirm the reminder wording explains the 48h cancellation deadline clearly, and the timing relationship. | email/assistant copy |
| C6 | **Review request "immediately" vs difficult-client exclusion** | Request immediately after the client leaves; owner wants difficult/inappropriate clients excluded ("if the client is a dick"). | Immediate automation can't apply a manual exclusion — confirm process, criteria, platform suitability. | review automation |
| C7 | **`groups.json` consult flags vs the confirmed rule** | Live site flags 10 categories as consult-first. Confirmed rule (owner + reception): a consultation **form** applies to **all** treatments (checked in Phorest — not a booking blocker); a **face-to-face** consult is required before booking **only for first-time anti-wrinkle/Botox** (Jessica, 15 min, free, **phone-booked, not online**). Fillers and SPMU need no face-to-face. **Slim Jab booking is itself** a free online consult (nurse, 15 min). Any consult fee charged is deducted from the treatment. | Set `groups.json` so only first-time anti-wrinkle is phone/consult-first; drop the over-flagging on the rest. **Done** — anti-wrinkle (and the POM items) stay consult-first; fillers, Profhilo, skin boosters, SPMU, PRP and hair growth are now bookable. | **APPLIED 1 Oct** (deployed) |
| C8 | **Patch-test list vs current flags** | Live site flags 2 categories as patch. Confirmed full list (reception): **tinting, hair colour, LVL lashes, eyelash extensions, eyebrow lamination, and laser (first treatment only)**. Repeat **every 12 months**, and again **after pregnancy**. Booked **by phone**, **overlapped with the treatment appointment**; completion recorded on the client card in Phorest. | Set the patch flags to this list (incl. laser-first and hair colour); phone-booking route. **Done** for Tinting/Lashes/Laser; hair colour & brow lamination are in mixed categories so named in copy, not gated per service. | **APPLIED 1 Oct** (deployed) |
| C9 | **Contact & email** | Site email "TBC"; hours empty `[]`; phone 01992 511383. Latest: email **halo@beautyheavenhub.co** ("halo", not "hello"); hours Mon/Fri/Sat 09:30–17:00, Tue–Thu 09:30–19:00 (Sunday not stated). | Set the email, hours and confirm phone. Escalation number **+44 7424 219417** is the same number planned for the WhatsApp bot — resolve the clash. | site content + bot config |
| C10 | **Payment options** | Earlier research mentioned Klarna; site copy had a "Klarna, finance, gift vouchers" TBC. Latest: **card, cash, gift vouchers** only. | Remove Klarna/finance from site copy. | site copy |
| C11 | **Unevidenced claims** | Site may still carry "97% pass rate" and "award-winning". | Remove both; do not replace with a new numerical/universal pass claim ("all students pass anyway"). "Recognised by all major insurance companies" and "CPD accredited" are supplied claims, not validated — don't present as proven. | **blocks publish** of claims |
| C12 | **B-TOX facial vs Microtox** | "B-TOX FACIAL" described as a "Botox facial"; a separate catalogue entry is **Microtox Facial** (£600). | Don't infer ingredients/claims or treat the two as equivalent. | menu/content accuracy |
| C13 | **Academy balance deadline** | Older desk research: balance 7 days vs one month. Latest: **£100 deposit, balance two weeks before** in-person training; **£599 Access course paid in full** (fully online). | Use the latest rule; retire the 7-day/1-month figures. | Academy copy |
| C14 | **"Foundation" vs "Beginners"** | Course list names "Beginners Dermal Filler" / "Beginners Anti-Wrinkle", but advanced courses list prerequisites as "Foundation Dermal Filler" / "Foundation Anti-Wrinkle". | Confirm these are the same course under two names; settle terminology; clarify what "Level 3" means in prerequisites. | Academy copy/prereqs |
| C15 | ~~**Sunbeds, no age rule**~~ **RESOLVED (reception)** | Sunbeds are **18+** and **ID is checked**. (Exact ID type accepted not specified — minor, see §C.) Under-18s can book brow waxing, nails, spray tanning and hair treatments. | Done — fold into the sunbed feature and age-check logic when built. | resolved |
| C16 | **TikTok wanted, self-scheduled** | TikTok wanted; but Jessica manages IG/FB/scheduling herself and does **not** want Good Work scheduling access. | Confirm TikTok account/workflow; do not enable auto-publishing from approval-console scope. | content console scope |
| C17 | **Trending music vs "own tracks" plan** | Latest: **trending music**, original branded tracks not required, no excluded styles. Guidelines section 13 and BRAND.md previously said "own music / to be chosen". | Guidelines amended 2026-10-01 (see below). Usage rights / platform availability for business accounts **not verified**. | content, rights unverified |
| C18 | **SPMU cancellation / no-show** | Latest: SPMU no-show charged **in full**. | Confirm against the general 48h full-price rule and configure. | blocks live behaviour |

---

## B. Receptionist answers — RECEIVED (now in the record, Section 3)

Reception answered B3–B9 after the main handover. What this settled:

- **B3** — phone-booking script and flow; details captured are **name, contact
  number, email** only; bookings go straight into Phorest/the diary; **no
  deposit taken over the phone**; confirmed once in the diary. **Every
  receptionist can book every treatment** (earlier caution lifted). Cancellation
  rules explained, and the client is asked to complete their consultation form,
  before the call ends.
- **B4** — **all treatments need a consultation form** (checked in Phorest);
  not all need a **face-to-face**. Face-to-face: 15 min, free, by the relevant
  practitioner; any fee is deducted. **First-time anti-wrinkle/Botox = face-to-
  face with Jessica, phone-booked.** Slim Jab booking is itself a free online
  nurse consult. (Feeds C7.)
- **B5** — anti-wrinkle/Botox questions → Jessica; suitability / pregnancy /
  medication / medical history / risks / recommendations → Jessica **or** Hollie;
  passed by phone **or** message (preferred channel not fixed — see §C).
- **B6 / B16** — patch tests (C8), booking fee (C1), lateness, age limits (C15)
  and urgent bookings all answered. Lateness: 10-min grace when a client follows;
  extended when the slot after is empty; on a lateness rebook the **original
  £1.20 fee is kept and a new £1.20 fee is taken**. Urgent-when-full: Jessica or
  Hollie approve the exception.
- **B9** — medical / complaints / urgent / unresolved all → Jessica or Hollie;
  if both unavailable, a team member contacts the client once they're free.
  (Still no separate backup contact — see §C.)

Small items reception left open are folded into §C.

---

## C. Owner / practitioner inputs and assets still needed

- Exact Academy teaching address/location ("we have this on Phorest", not
  transcribed); Barnsley/Wombwell clarification if relevant (do **not** list a
  Barnsley site without confirmation).
- Booking rules for **every practitioner except Jessica and Hollie**; treatment
  prices and durations for everyone (Jessica/Hollie prices not transcribed from
  screenshots — confirm from the live menu, don't guess).
- The complete item-level **A18 affected-treatment list** — Good Work supplies
  it, then Hollie confirms per treatment: retained/removed, practitioner,
  booking route, price, duration. Flagged areas: HIFU, massage, some nails,
  some hair, lymphatic drainage, some lashes, two filler treatments.
- Course **certificate / accreditation body evidence** (exact CPD body not
  named); exact certificate wording if required.
- **From reception (small, non-blocking):** the preferred channel for passing
  practitioner enquiries (phone vs message); confirmation of how the £1.20 fee is
  recorded against phone bookings in the live Phorest set-up; and the exact ID
  type accepted for sunbeds. (No patch-test exceptions beyond the list.)
- **Team assets:** proper headshots, titles/bios, before-and-afters, Google
  reviews (permission given — "we can use all the reviews"), certificates.
  Personal information must never be shown; permission is via consent forms
  (wording/scope not inspected).
- **Written aftercare** per treatment — Jessica to create, supply and approve.
  Do not publish or send invented clinical aftercare.
- **Domain/email** delegated access for Jordan (no passwords/credentials
  shared); shared **content photo folder** set-up; **TikTok** workflow.
- Further examples of the other existing automated messages (beyond the supplied
  reminder and confirmation examples).
- The proposed **conduct policy** (rude/abusive behaviour, refusal of service,
  charging consequences) — Jordan's proposal, no final terms agreed; don't
  implement as policy.

---

## D. Confirmed and settled (for reference — carry into the build)

- **Owners:** Jess and Hollie. Website priorities: treatment bookings **and**
  filling Academy courses. Feedback positive ("we're fucking loving the website
  so far"); no specific dislikes.
- **Location:** The Hub, 23–24 Conduit Lane, Hoddesdon, Hertfordshire, EN11 8FN
  ("yes correct"); Academy branch postcode SG13 8QL (full address outstanding).
- **Hours (public):** Mon/Fri/Sat 09:30–17:00; Tue/Wed/Thu 09:30–19:00; Sunday
  not stated.
- **Email:** halo@beautyheavenhub.co — "halo", not "hello".
- **Payments:** card, cash, gift vouchers.
- **Cancellation:** 48h notice; full treatment price inside 48h or for a no-show.
- **Consultation rules (latest):** first-time anti-wrinkle only (Jessica, 15 min,
  free, not online); Slim Jab booking is itself a free online consult (nurse,
  15 min); fillers and SPMU need no prior consult; **£25 anti-wrinkle/Botox
  prescription fee**, deducted from the treatment price.
- **Academy:** 20 courses (full catalogue in the discovery record); all one-to-one;
  dates agreed individually; online theory; CPD accredited; tutor Jessica or
  Hollie. In-person courses £100 deposit, balance two weeks before; **£599
  Access to Aesthetics** fully online, paid in full. Kits not included (optional
  £500 kits for Microblading, Lip Blush, 4-Day SPMU). Theory certificate by
  L3 Matrix; practical certificate by the salon.
- **Academy models:** advertised in a model WhatsApp group; models phone, pay in
  full, book through the salon — **no online model bookings**. Website offers
  interest registration only (not auto-confirmation).
- **Jessica's schedule:** Mon–Fri 09:30–14:45; extra Tue/Thu 17:00–20:00; Sat
  09:30–17:00. Late-empty-day: treatments over £85, ≥1h notice, auto-confirm OK.
- **Hollie's schedule:** Mon–Thu 09:30–14:45; extra Tue/Wed 15:45–19:00;
  Fri/Sat 09:30–17:00. Late-empty-day: treatments over £50, ≥1h notice,
  auto-confirm OK.
- **Max advance booking:** up to one year; no minimum notice stated.
- **Practitioners:** self-employed, rent a room, set own dates/prices/offerings,
  take own payments, invoice own clients, use own kit, own insurance. Beauty
  Heaven keeps the booking fee. ~18 in the group chat, four are receptionists —
  practitioner count **not** confirmed (do not derive 14). Owners want written
  rental agreements and an insurance-logging system put in place.
- **Reception:** phones answered by Jodie or Olivia. 20–40 online bookings/day.
  Line provider BT, calls forwarded. Daily missed-call summary to the girls
  requested (route/timing/definition undecided).
- **Tone:** friendly, professional, warm, approachable, sympathetic. **No medical
  advice.** AI must introduce itself as AI ("because we must be honest"). No audio
  recording; transcripts may be retained (wording not agreed). Escalation
  (medical/suitability, complaints, urgent full-diary, unresolved, out-of-hours):
  Jessica & Hollie, +44 7424 219417, no backup.
- **Emails kept:** confirmations, reminders, cancellations, receipts, reviews,
  marketing. No birthday messages currently. Reminder timing **48 hours**.
  Review link: https://share.google/yDOTBa9VGMfotHuwD.
- **Content:** weekly team photos to a shared folder (Jessica organises); Jessica
  approves daily and manages IG/FB and scheduling herself; TikTok wanted;
  trending music; never show personal information.
- **Reception / phone booking (confirmed 1 Oct):** every receptionist can book
  every treatment; phone bookings go straight into the Phorest diary with **no
  fee taken on the call**; details captured are name, contact number and email;
  the call ends with the cancellation rules and a nudge to complete the
  consultation form.
- **Consultation form:** required for all treatments, checked in Phorest; if not
  done by 48h before, it can be completed on the day.
- **Lateness:** 10-minute grace when a client follows; extended when the slot
  after is empty; a lateness rebook keeps the original £1.20 fee **and** takes a
  new £1.20 fee.
- **Age:** under-18s can book brow waxing, nails, spray tanning and hair; sunbeds
  18+ with ID checked (ID type unspecified); SPMU, intimate waxing, Botox,
  fillers, aesthetics and laser remain 18+ with ID.
- **Urgent-when-full & escalation:** Jessica or Hollie approve full-diary
  exceptions and take medical/complaints/unresolved; if both are unavailable, a
  team member follows up when they're free (no separate backup).

---

## E. Deliberately set aside / excluded

- **CRM/platform choice** (GoHighLevel / Twenty) — no decision agreed. E2, E3,
  B13, B14 set aside from the questionnaire.
- **Photo-analysis / pre-consultation photo flow** (B13/B14) — was Jordan's
  proposal; Dermis reportedly being discontinued; not a settled requirement.
  Assistants give no medical advice and no diagnosis from photos.

---

## F. Historical unverified counts — do not present as confirmed

The original prompt reported ~473 services / 42 categories, ~92 hidden online,
~30 Academy courses, ~20 model services (8 courses online), ~15 practitioners,
~57 problematic online services. These were labelled unverified and were **not**
validated this session. The latest supplied catalogue lists **20 courses** — do
not invent courses to match the older estimate.
