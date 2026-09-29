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
