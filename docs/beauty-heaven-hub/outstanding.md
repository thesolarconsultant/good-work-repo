# Beauty Heaven Hub — outstanding questions and conflicts

**Status: live tracker.** Drawn from the discovery record
[`discovery-2026-10-01.md`](discovery-2026-10-01.md) on 1 October 2026. Keep it
updated as answers come in. Nothing here authorises changing live settings,
sending messages or switching on payments — the conflicts marked **blocks live
behaviour** must be confirmed by Jess or Hollie before the booking flow, the
assistants or the emails change.

Last reviewed: 2026-10-01.

---

## A. Conflicts to resolve

These are places where the record contradicts itself, contradicts the live
preview site, or leaves a rule too loose to build on. Each needs a decision
before the affected feature goes live.

| # | Conflict | What we have | Needs | Impact |
|---|----------|--------------|-------|--------|
| C1 | **Deposit vs booking fee** | Site copy says "50% deposit"; meeting said £1.20 pre-auth; latest says £1.50 **currently taken and labelled a deposit**, with Jessica wanting it reconfigured as a **£1.50 booking fee on top** of the price. | Confirm the final amount, whether it is added or deducted, and refund/cancellation handling. Not yet configured. | **blocks live behaviour** + site copy is now wrong |
| C2 | **Public hours vs Jessica's schedule** | Public close Tue/Thu 19:00; Jessica works an extra Tue/Thu 17:00–20:00 (finishes 20:00). | Confirm whether practitioners legitimately run past public closing, or this is a schedule mismatch. | blocks practitioner booking rules |
| C3 | **Same-day bookings vs 48h forms** | Same-day bookings allowed; online forms expected 48h before. | How a same-day booking satisfies (or is exempt from) the 48h form rule. | blocks assistant/booking logic |
| C4 | **"Late bookings on otherwise empty days"** | Jessica: treatments **over £85**; Hollie: **over £50**; ≥1h notice; assistant may confirm without asking. "Otherwise empty day" and "late" undefined; no rule authorises booking outside working hours. | Operational definition of "late" and "otherwise empty day". Note "over" means strictly over, not "at least". | blocks assistant auto-confirm rule |
| C5 | **Reminder vs cancellation window** | Reminder 48h before (seven-day idea withdrawn); cancellation cutoff also 48h, full price inside it or for a no-show. | Confirm the reminder wording explains the 48h cancellation deadline clearly, and the timing relationship. | email/assistant copy |
| C6 | **Review request "immediately" vs difficult-client exclusion** | Request immediately after the client leaves; owner wants difficult/inappropriate clients excluded ("if the client is a dick"). | Immediate automation can't apply a manual exclusion — confirm process, criteria, platform suitability. | review automation |
| C7 | **`groups.json` consult flags vs latest rule** | Live site flags 10 categories as consult-first. Latest rule: only **first-time anti-wrinkle** needs a consult before booking (Jessica, 15 min, free, not online); fillers and SPMU need none; **Slim Jab booking is itself** a free online consult (nurse, 15 min). | Reconcile the live `data/groups.json` flags against the actual Phorest settings. | **blocks live behaviour** |
| C8 | **Patch-test list vs current flags** | Live site flags 2 categories as patch. Latest list: **tinting, hair colour, LVL lashes, eyelash extensions, brow lamination**, 48h before; booked **by phone** (test is in person, not by phone). | Reconcile the patch flags; add brow lamination / hair colour / LVL if missing; set phone-booking route. | **blocks live behaviour** |
| C9 | **Contact & email** | Site email "TBC"; hours empty `[]`; phone 01992 511383. Latest: email **halo@beautyheavenhub.co** ("halo", not "hello"); hours Mon/Fri/Sat 09:30–17:00, Tue–Thu 09:30–19:00 (Sunday not stated). | Set the email, hours and confirm phone. Escalation number **+44 7424 219417** is the same number planned for the WhatsApp bot — resolve the clash. | site content + bot config |
| C10 | **Payment options** | Earlier research mentioned Klarna; site copy had a "Klarna, finance, gift vouchers" TBC. Latest: **card, cash, gift vouchers** only. | Remove Klarna/finance from site copy. | site copy |
| C11 | **Unevidenced claims** | Site may still carry "97% pass rate" and "award-winning". | Remove both; do not replace with a new numerical/universal pass claim ("all students pass anyway"). "Recognised by all major insurance companies" and "CPD accredited" are supplied claims, not validated — don't present as proven. | **blocks publish** of claims |
| C12 | **B-TOX facial vs Microtox** | "B-TOX FACIAL" described as a "Botox facial"; a separate catalogue entry is **Microtox Facial** (£600). | Don't infer ingredients/claims or treat the two as equivalent. | menu/content accuracy |
| C13 | **Academy balance deadline** | Older desk research: balance 7 days vs one month. Latest: **£100 deposit, balance two weeks before** in-person training; **£599 Access course paid in full** (fully online). | Use the latest rule; retire the 7-day/1-month figures. | Academy copy |
| C14 | **"Foundation" vs "Beginners"** | Course list names "Beginners Dermal Filler" / "Beginners Anti-Wrinkle", but advanced courses list prerequisites as "Foundation Dermal Filler" / "Foundation Anti-Wrinkle". | Confirm these are the same course under two names; settle terminology; clarify what "Level 3" means in prerequisites. | Academy copy/prereqs |
| C15 | **Sunbeds featured, no age rule** | Sunbeds to be featured (under-booked). Age rule for sunbeds **not supplied** (other 18+ rules are). | Supply the sunbed age rule before publishing a sunbed booking route. | blocks sunbed feature |
| C16 | **TikTok wanted, self-scheduled** | TikTok wanted; but Jessica manages IG/FB/scheduling herself and does **not** want Good Work scheduling access. | Confirm TikTok account/workflow; do not enable auto-publishing from approval-console scope. | content console scope |
| C17 | **Trending music vs "own tracks" plan** | Latest: **trending music**, original branded tracks not required, no excluded styles. Guidelines section 13 and BRAND.md previously said "own music / to be chosen". | Guidelines amended 2026-10-01 (see below). Usage rights / platform availability for business accounts **not verified**. | content, rights unverified |
| C18 | **SPMU cancellation / no-show** | Latest: SPMU no-show charged **in full**. | Confirm against the general 48h full-price rule and configure. | blocks live behaviour |

---

## B. Awaiting the receptionist (keep open — do not fill with assumptions)

- **B3** — caller questions and their order, client details captured, diary
  entry/confirmation steps, and which receptionist can book which treatment
  (don't assume every receptionist can book everything).
- **B4** — practical consultation checks at the desk, and the existing
  online-booking exclusions as actually applied.
- **B5** — the medical/suitability escalation process at reception.
- **B6 / B16** — patch-test repeat interval and other triggers; booking-fee /
  deposit collection steps; what happens with incomplete forms; late-arrival
  charge mechanics (is the original appointment also charged?); age/ID practice
  including sunbeds; rules for bookings outside the diary; full-diary exception
  handling.
- **B9** — operational escalation contacts, backups, and out-of-hours follow-up
  timing. No backup contact has been supplied for medical/suitability,
  complaints or urgent bookings.

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
