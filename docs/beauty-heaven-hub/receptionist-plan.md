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

## Where client photos would live: forward only, keep nothing (revised 2026-10-01)
The user's preference, and the better privacy design: we do not keep client photos. Flow: the assistant asks for consent
and logs it; the client sends photos; our server fetches each one (WhatsApp media links expire within minutes, so it must)
and passes it straight to the routed practitioner, holding it in memory only long enough to deliver; nothing is written
to storage. We keep a **text-only log**: consent given and when, who it was routed to, when it was delivered, and that a
photo was included. No image is ever used for content or marketing.
Limits to be honest about, and to reflect in the consent message (never promise "deleted in 24 hours" unless it is true):
- **We cannot delete from other people's phones.** A photo forwarded into a practitioner's WhatsApp sits on their
  phone, and possibly in their camera roll and cloud backup. Practitioners should turn off media auto-save, and we
  can suggest disappearing messages for that thread, but we cannot enforce it. Meta also processes the messages.
- **The reply window.** A business number can message a person freely only within 24 hours of their last message to it,
  so practitioners need to have messaged the number recently, or the alert goes out as an approved template.
- **A photo that informs a treatment becomes part of the clinical record.** Insurers may expect records to be kept, so
  the practitioner should save it to the client record by hand if the client goes ahead (in the consultation app or
  Phorest, if either holds photos). Otherwise it is triage only, and the client resends at the consultation.
- **The agent must not decide where a photo goes.** Routing, consent logging and the no-storage rule live in plain code.
  The model only reads the conversation and proposes a practitioner from a fixed list.
- **Still needs a small database, for text only:** the staff allowlist, conversation memory (so the agent does not forget
  between messages), consent records and the routing log.
- **If a stored copy is ever wanted,** use a private bucket with short-lived links and auto-delete. Google Drive only as
  a pilot, on a business Workspace account with link sharing off.

## Conversation records (decided 2026-10-01: we keep them)
The user wants a record of conversations. Text transcripts only, in the small database we already need.
- **What is kept:** WhatsApp messages and call transcripts, with time, channel and the phone number. A photo appears only
  as a placeholder ("photo sent, forwarded to X at 14:02"). Audio is not kept unless the salon decides to record calls.
- **Why:** proof of what was said and agreed (deposits, cancellation, consent), context when a person takes over,
  reviewing the assistant's mistakes, and the agent's own memory between messages.
- **These are personal data, and sometimes health data** (clients describe conditions in text). Needs: a plain notice at
  the start ("this chat is handled by an assistant and the conversation is recorded"), a stated purpose, a retention period
  the salon chooses (for example 12 months for general enquiries, longer where it feeds a clinical record, confirmed with
  their insurer), a way to find and delete one person's messages on request, and access limited to the owners and the
  practitioner a client was routed to. Confirm the wording with a data-protection adviser. This is not legal advice.
- **Never used for:** training, marketing, or the content agents. Client chats and the owners' operator chat are kept in
  separate logs with separate access.
- **Calls:** recording audio is a separate decision with a spoken disclosure. Interview B10.
- **Phorest:** a short summary goes on the booking note, so staff see it where they already look.

## Who holds the records (2026-10-01)
Beauty Heaven decides what is kept and why, so the salon is the data controller and Good Work, running the server and
database, acts as its processor. In practice:
- **A short written data agreement** between Beauty Heaven and Good Work covering what we process, for what, where it is
  stored, who can see it, how long it is kept, what happens if either side ends the arrangement, and what we do if
  something goes wrong. To be drafted, then checked by a solicitor.
- **Hosting:** a UK or EU region, with access limited to named people at Good Work and the two owners.
- **Their copy:** the owners can export their records on request, and everything is returned or deleted at the end.
- **Their own notice:** the salon's privacy notice needs a line about the assistant and recorded conversations. We supply
  the wording; they publish it.
- The signed proposal does not mention any of this, so it goes in a short follow-up, not a reopening of the proposal.

### Caveat: most practitioners are self-employed (2026-10-01)
The section above assumes the salon alone decides what is kept. Self-employed practitioners run their own businesses, so for
their own clients they may be **separate controllers**, or **joint controllers** with the salon. It depends on whose
clients they are, who holds the client relationship, and who keeps the treatment records. Working assumption to check with
an adviser:
- **The salon** controls the enquiry and booking side: the WhatsApp number, the phone line, the diary in Phorest and the
  conversation records.
- **Each practitioner** is responsible for their own clinical records once a client proceeds, including any photo they
  choose to save, and for their own insurance.
- **Routing a client's photo to a practitioner is a disclosure to another business.** The consent message must say who will
  see it ("the practitioner who will do your consultation"), not just "the salon".
- The salon may need a short agreement with its practitioners about client data, and the membership idea would sit
  alongside that. Keep this separate from any fee tied to bookings, which raises the HMRC status point above.
Interview B15 now asks whose clients they are and who keeps the records.

## The control-versus-charge tension (2026-10-01)
The owners want control over what practitioners do, and a charge because clients arrive through Beauty Heaven. These pull
against each other: the more the salon directs how practitioners work, the more they look like staff, not independents.
HMRC and employment tribunals decide from the facts (control, whether they must do the work personally, whether they can
send a substitute, whether either side must offer or accept work), not from the label in a contract. Get the salon's
accountant or an employment adviser to look at this **before the assistant starts steering clients**.
- **Control that is safe to keep:** brand, safety and quality standards, insurance and qualification checks, the
  consultation process, the client experience and the house rules.
- **Control that looks like employment:** setting their hours and diary, setting their prices, forcing them to take
  a client, deciding who they may work with.
- **Charging routes, from most independent to least:** a flat monthly rent or membership; a fee per booking that
  practitioners may decline; a commission where the salon takes payment and pays them out (raises VAT and status questions).
- **Design consequences:** the assistant offers a client to a practitioner and the practitioner can accept or decline;
  a client can ask for a named practitioner; practitioners set their own prices in Phorest; fee rates are settings, not
  code; a per-practitioner report shows bookings that came through the site, phone and WhatsApp, as evidence for whichever
  fee is chosen.
- Whether the client is contracting with the salon or the practitioner matters too. Deposits are paid to the salon through
  Phorest and the T&Cs are the salon's, which points towards the salon.

## Practitioners' own clients, and owning the platform (idea, 2026-10-01)
Idea: a platform Beauty Heaven owns outright, where each practitioner also brings their own clients through their own page
or app. Two stages, and only the first is in scope now.
1. **On top of Phorest (now).** Phorest supports direct booking links to a single practitioner. Each practitioner gets a
   profile page and their own link for their socials and word of mouth. Those bookings land in the same diary. Every booking
   carries a source tag: **own client** (their own link) or **salon client** (site, phone, WhatsApp assistant). A fee, if
   the owners choose one, applies only to salon-sourced clients. That answers most of the control-versus-charge problem.
   To check with Phorest: whether the API can record a source on a booking or client (otherwise the tag goes in the note),
   and whether its own commission and rent settings already cover a fee.
2. **Our own diary and client app (later, separate product).** This means replacing Phorest: diary, payments, client
   records, consent forms, reminders, staff commission and reporting, plus migration, training and support, and the
   diary must never double-book. That is a product in its own right, not part of the £2,800 build or the £398 platform.
   Only worth deciding once stage 1 has run and shown what practitioners actually pay for.

### How this sits against the strategy deck (checked 2026-10-01)
The deck (`strategy/index.html`) already frames the direction: keep and connect Phorest first, replace or own only where the
case is proven; an owned Academy platform; Path A (make Beauty Heaven stronger) versus Path B (a technology business for
the industry); and a marketplace and CRM for professionals. It also commits us to restraint: "we won't build something
because we can", "harder to prove, not harder to design", "start embarrassingly small", and several open questions "could
stop the project". So stage 1 above is Path A, and the per-practitioner pages with source tags are the first honest step
towards the professionals' tools in Path B: they produce the evidence the deck says we need. Two gaps between the deck and
what we have found: the Academy "own platform" case is unproven (no certificates in L3 Matrix, accreditation unknown, the
deck itself says we need access to the current system first), and the licensed AI skin-analysis consultation tool the deck
lists needs its cost and role confirmed (interview B13).
