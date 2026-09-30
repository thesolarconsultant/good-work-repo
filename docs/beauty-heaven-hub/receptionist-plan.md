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
in writing, and it is the salon's decision, not ours. **Not asked in the interview**: raise it only after the results are back.

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
Interview Part C now asks whose clients they are and who keeps the records.

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

## Scope as stated by the user, 2026-10-01 (v2)
Decided: **the website links to Phorest booking. No own diary or marketplace for now** (later idea, see above).
1. **WhatsApp receptionist:** answers, books services into Phorest, sends a consultation straight to the right practitioner,
   and forwards photos to that practitioner (forward-only, nothing stored by us).
2. **WhatsApp with Jess and Hollie, weekly on a day they confirm:** what content to work on, from templates and styles we
   agree in advance. Approved content is posted on a set schedule through an external scheduler (the user named Upload-Post).
   Blog ideas go to Jess and Hollie, and possibly to practitioners, for approval; the user wants 4 to 6 blogs a week.
3. **Content Console** holds every template (SMS, email, WhatsApp; email HTML on brand), suggests reels, and creates
   carousels, single images and video on the five-pillar process. Target: 5 reels a week, from clips sent into the chat, and
   pre-cut videos that practitioners voice over; AI-generated video only if that is not possible.
4. **One coordinating "big brain"** controls the agents. We agree a strict plan before anything goes live.

### Flags raised against that scope
- **Proposal scope.** "Running the socials" (posting, reels, blogs at volume) sits under GOOD GROWTH in the signed proposal,
  priced per client. The console as a tool is in the £398. Agree which parts are which before promising.
- **Blogs at 4 to 6 a week** is 200 to 300 a year. Risks: thin, repetitive content can hurt search ranking; each needs
  a human approval from busy people; approvals become rubber-stamping. Suggest starting at 1 to 2 strong posts a week and
  scaling on results.
- **Prescription-only treatments** (anti-wrinkle, fillers): social and blog content is advertising. Approval must include a
  fixed compliance checklist (no brand names for prescription-only products, no unsupported claims or results), to be
  confirmed with an adviser.
- **AI video.** Fine for rooms, product, text animation and backgrounds. Not for faces performing treatments or showing
  results (the proposal already says generated imagery is never presented as a real client or result). Real clips from
  practitioners, captioned and edited by us, are safer and perform better. A cloned voice needs the person's written consent.
- **Practitioners' involvement** should be opt-in. Making self-employed practitioners do unpaid tasks looks like control.
- **Scheduler limits:** check what Upload-Post (or any scheduler) supports for Instagram Reels and TikTok, and that each
  account is a business account owned by Beauty Heaven, before we promise it.
- **WhatsApp groups:** the business API has had limits on group chats. Verify before promising a group thread; fall back
  to one thread per owner or a private approvals page.
- **Architecture:** not one agent with every permission. One coordinator (schedule, approvals, kill switch, audit log) over
  separate agents with separate permissions: receptionist, content planner, publisher. A client message must never be able
  to reach the publisher.
- **Running it on the user's own Claude account:** production automation for a client should use the API under a business
  account, on a server, not a personal subscription login. Check Anthropic's current terms. It is also cleaner for cost,
  audit and data handling.
- **Are the practitioners' jobs Beauty Heaven's jobs?** Unknown. Interview Part C (C1 to C10). Insurance does not move data-protection
  duties: what the salon's assistant collects and passes on is the salon's responsibility, whoever is insured for treatments.
  Practitioners keep what they are sent as part of their own records if they proceed. Design is unchanged: forward-only.

## Website structure (user, 2026-10-01)
One site, two sides, chosen on the homepage ("I want a treatment" / "I want to learn"; the private mock-up already has this fork):
- **Treatments:** see the services and book. Links to Phorest booking, by category, service or practitioner. Anything not bookable
  online (for example the anti-wrinkle and semi-permanent consultations) goes to WhatsApp.
- **Academy:** what courses they run, and how to ask about them. "Ask for pricing" opens WhatsApp with a message already
  written for that course, and the assistant answers, collects details and books the deposit in Phorest.
Notes:
- **Prices already public.** Phorest lists some course prices online (for example Foundation Anti-Wrinkle £1,500 and
  Foundation Dermal Filler £1,750), so "price on request" on the site would not hide them. Decide with the owners: show them,
  or show a deposit and "from" price.
- **Only list courses confirmed as running.** Certificate and accreditation wording per the rule above.
- **Give people without WhatsApp another way:** phone number and a short enquiry form, which the assistant also picks up.
- **Students on L3 Matrix need a computer or tablet**, so the Academy page and the post-deposit email say so.

## Gate: are the practitioners really independent? (user, 2026-10-01)
The user's working view: practitioners probably control their own booking times, the risk sits with Beauty Heaven, and Beauty
Heaven should be earning from the bookings it sends them. Whether they are truly self-employed, or self-employed in title but
working in practice from Beauty Heaven's work, is a matter of the real facts, not the label. We do not decide it. The
interview now has a **must-answer Part C (C1 to C10)** covering pay, who sets hours and prices, where clients come from,
who takes payment, substitution, written terms, insurance and complaints. The owners should take advice from an accountant or
employment adviser on the answers. If the facts show more employment-like control, that is a matter for the salon, and
we do not raise it with practitioners.
**Client photos wait for the answer.** We do not build photo intake until Part C is back.
- If practitioners are genuinely independent: forward-only, and each keeps what they are sent as part of their own records.
- If in practice they work for the salon: the salon is responsible for those records and must control where images sit.
  Forwarding into personal WhatsApp is then too loose. Use a controlled store (private storage with short-lived links, or
  the record in Phorest or the consultation app) with a set retention period.

## WhatsApp or Telegram (user, 2026-10-01)
Not the same for this job. The agent core is built channel-agnostic, with one adapter per channel, so adding Telegram is small.
- **Clients: WhatsApp.** It is where UK salon clients already are. Telegram adoption is low, and asking clients to install an app
  is a lost booking.
- **Owners and staff (operator side):** Telegram is easier to build on (free bots, no business verification, no 24-hour reply
  window or approved templates, real group chats with bots, buttons, file handling). But the signed proposal says the team feeds
  the console "in the place you already are", on WhatsApp, so moving them to Telegram needs their agreement.
- **Health photos:** as far as we know, Telegram bot chats are not end-to-end encrypted and sit on Telegram's servers. Do not
  route client photos over Telegram without checking that with a data-protection adviser.
- **Use Telegram for us:** build and test the whole flow on Telegram first while the WhatsApp number is being verified, then
  launch clients on WhatsApp. Owners may choose Telegram for approvals if they prefer.

## Clients without WhatsApp, and hosting (user, 2026-10-01)
- **No SMS bot** (cost). Clients without WhatsApp can phone (the voice agent answers) or use the website form and the
  Phorest booking page. Telegram can be added for clients as a text-only channel at little build cost, but it adds a channel
  to support, disclose in the privacy notice and test, and photos should not go over it. Decision for the owners and the user.
- **Hosting: AWS, Lambda over EC2, London region (eu-west-2).** The workload is webhook-driven (messages in, agent runs, reply
  out) with scheduled jobs (EventBridge Scheduler), so Lambda scales to zero and there is no server to patch. WhatsApp expects a
  quick 200 response, so acknowledge fast and hand the agent work to a queue (SQS). Use EC2 only for a long-lived process.
  Secrets in Secrets Manager or Parameter Store. Keep personal data out of application logs. A small database (DynamoDB or
  Postgres) for text only. Define everything as code (CDK, SAM or Terraform) so it can be rebuilt and handed over.
- **Whose AWS account:** decide with the data agreement. An account in Beauty Heaven's name means they own the data and the bill,
  with Good Work given a limited role. Either way: MFA on the root user, no shared logins, least-privilege roles, billing alarms.
- **Model access:** direct Anthropic API under a business account, or Amazon Bedrock inside AWS (check that the chosen models are
  available in the London region and what that does to cost).
- Already on Vercel: the website and current functions. Agents could run there too, so AWS is a choice, not a need.

### Hosting, revised: Vercel is a good fit (user, 2026-10-01)
Vercel already hosts the site and deploys from `main`, so keeping the agents there means one place, one deploy, one set of
environment variables. Prefer it unless a need below forces AWS.
- **Plan:** commercial use needs a paid plan (the free Hobby plan is not for commercial use). Check current pricing. Put the
  project in a team in Beauty Heaven's name or Good Work's, per the data agreement, with the other side as a member.
- **Region:** set functions to London (lhr1). The database must also be London or EU.
- **Database:** Vercel has none of its own. Add a managed Postgres from the Marketplace (for example Neon or Supabase), text only.
- **Timing:** acknowledge a webhook fast, then finish the agent work after the response or through a queue. Check current function
  duration limits. Scheduled posts use Vercel Cron plus a table of scheduled items. Use the Node runtime, not edge, for agent code.
- **Voice:** if a hosted voice platform makes the call and calls our webhooks, no always-on server is needed.
- **AWS only if:** we need a long-lived process (for example a streaming voice server), tighter audit and access controls, or
  Bedrock inside the account.

### Decision: Vercel plus Supabase (2026-10-01)
- **Vercel** runs the site, the webhooks and the scheduled jobs. **Supabase** holds the data: a Postgres database in the London
  region (choose it when creating the project; it is hard to change later).
- **Why Supabase:** Postgres, staff logins (Jess and Hollie sign in to approve content), row-level security, private file storage
  with short-lived links if the controlled-store photo option is ever needed, and scheduled jobs (pg_cron) to delete old
  messages on the retention schedule.
- **Rules:** a paid plan (the free plan pauses inactive projects and does not back up); row-level security on every table; the
  service key only on the server, never in the browser; backups on; text only unless the controlled-store photo option is chosen.
- **Ownership:** create the Supabase organisation in the name agreed in the data agreement, with the other side as a member.
  Both vendors go on the privacy notice as sub-processors.
- **First tables:** staff allowlist; contacts; messages; consent records; routing log; content calendar and approvals; audit log.

### Decision: whose accounts (2026-10-01)
- **Runs under Good Work's Vercel team and Supabase organisation, one separate project per client**, never a shared database.
  Hosting is included in the £398, so Good Work pays and it is simplest to bill. Named clearly, London region.
- **Beauty Heaven's business assets stay in Beauty Heaven's name:** the domain, the Meta Business portfolio and the WhatsApp
  Business account, the social accounts, Google Business Profile, Stripe and the Phorest account. Good Work is given access.
- **Written into the data agreement:** Good Work is the processor, hosting is described, and on request or at the end the
  project is transferred to Beauty Heaven's own account (both vendors support project transfers; confirm) or exported and deleted.
- **Housekeeping:** a second admin at Good Work for continuity, 2-step sign-in on every account, least-privilege access, and
  secrets kept separate per project.
- If the future product idea goes ahead and Beauty Heaven owns the code, the project moves to their account then.

## Marketing (GOOD GROWTH): the gate (user, 2026-10-01)
Marketing is considered only once the build is running and only if the numbers make sense. If practitioners are self-employed, the
cost could be split per person.
- **Test before selling:** for each service line, average price, margin, how often a client returns, and what a booking is
  worth. Break-even is spend divided by margin per booking, so we know how many extra bookings a month must be won.
  Data needed from Phorest (export or API): revenue by staff and service, client counts, last-visit dates, and marketing consent.
- **Source tags from day one** (site, phone, WhatsApp, own link) so that in a few months we can show which channels bring
  bookings. Without them the numbers cannot be judged.
- **Cheapest first:** organic content, then email and WhatsApp to lapsed clients who have opted in, then paid ads.
- **Paid ads:** Meta has tight rules on health and injectable treatments. Check before promising any.
- **Splitting the cost:** pooled budgets work better than a small budget per person, so run one campaign and allocate cost by
  agreed share (for example bookings or opt-in tier). Options: (1) base package for the salon plus optional practitioner
  add-ons (recommended); (2) each practitioner buys directly from Good Work; (3) the salon buys and recharges (the salon-control
  and status question applies).
- **Opt-in only**, in writing, and the owners' decision.

## Content inbox in Google Drive (user, 2026-10-01)
Aim: the team drop photos and clips into Google Drive, and each week the content agents turn approved ones into posts, carousels and reels.
- **Account:** a Google Workspace account owned by Beauty Heaven, not personal Gmail (video fills the free 15GB quickly; check the plan's storage).
- **Folders:** `Inbox` (anyone on the team uploads from the Drive phone app) and `Approved` (only Jess or Hollie move things here), with
  sub-folders such as treatments, rooms, team, video clips. **The agents read only `Approved`.**
- **Consent sheet:** a Google Sheet beside the folders: file, who is in it, consent given (yes or no, and how), approved for social,
  for the website, both. No consent entry means the agent skips the file. Before-and-after images of injectables carry advertising
  rules, so they need a compliance check before approval.
- **Consultation photos never go in this Drive.** It is for marketing material only.
- **How Claude reaches it:** the Claude app's Drive connector is for interactive use. For the automated weekly job our server calls
  Google's Drive API with a service account that has been shared one folder only, so it cannot see anything else in their Drive.
- **Weekly loop:** the agent scans `Approved` for new items, drafts posts and reels, sends the plan to the owners for approval in the
  chat, and posts through the scheduler at the agreed times.
- **Privacy:** images are sent to model providers to be described and edited, so say so in the privacy notice, and only approved
  files are ever sent.
- **Rights:** a photo belongs to whoever took it. Self-employed practitioners who take photos on their own phones should agree, in
  writing, that the salon may use them, and anyone shown in a photo needs to be happy to be used.
- **Moving files:** copy the best 100 to 200 into `Approved` rather than moving everything, and leave the originals where they are.

## Build readiness (2026-10-01): what the visit unblocks, and what it does not
**The visit unblocks:** access to their accounts, the Meta and WhatsApp verification starting, the Phorest API request going out, the
location answer, the phone provider, the practitioner facts (Part C), the rules for consultations, and the content sources.
**Still outside our control after the visit:**
- Phorest's decision on API access and its cost. Until it arrives, booking through the assistant and the voice agent cannot go live. Fallback: link to
  the Phorest page and take messages.
- Meta business verification and approval of WhatsApp message templates (days).
- The phone provider's ability to forward unanswered and out-of-hours calls.
- Owners' approval of the website copy, prices, treatment write-ups and the content plan.
- Advice on advertising rules for prescription-only treatments, the data agreement, the privacy notice and call-recording wording.
- Setting up delivery: Vercel and Supabase accounts, email sending, DNS.
**The proposal says about ten working days.** That is realistic for the website, the email templates and the console. The assistants
go live in stages, each after its outside dependency clears and after a dry-run period. Tell the owners this before it becomes a surprise.
**Can start before any of that:** the website build, the email templates, replacing the console placeholder facts once the location is
confirmed, the Supabase schema, and a dry-run receptionist prototype on Telegram.

### Email templates: on hold (user, 2026-10-01)
The salon's emails already live in Phorest, so we do not build new templates yet. Once we can see them, we copy their wording and look
into our own HTML. Phorest's email editor takes no HTML import, so this is a recreation, not a file copy.

## Back to Google Drive (user, 2026-09-30)
Decision: **Google Drive**, as in the section above. One Google account in the salon's name covers Drive, YouTube and Google
Business; Jess had already started; free 15GB, then a Google One plan if needed. Dropbox's one advantage was uploads without an
account. On Drive, anyone who can add to a folder can also see and delete in it, so: the team send clips to the WhatsApp content
assistant, which files them in `Inbox`, and only `Inbox` is shared with the team's Google accounts. `Approved` stays with the owners,
and agents read only `Approved`. The Dropbox notes below are kept for reference only.

### (Superseded) Content inbox: Dropbox instead of Google Drive
Same design as the Drive inbox above (`Inbox`, `Approved`, agents read only `Approved`, consultation photos never go in), on Dropbox:
- **Account:** Dropbox in the salon's name, not personal. A paid plan (the free 2GB fills with a week of video). Check current plans;
  Dropbox Business adds admin control and removing a person's access when they leave.
- **The team upload without an account:** a Dropbox **File request** link on the `Inbox` folder. Anyone with the link can upload from
  their phone but cannot see or change anything else. Practitioners don't need Dropbox. This is the main advantage over Drive.
- **How our server reads it:** a Dropbox app registered by Good Work, authorised once by the salon, with the narrowest scopes (read files,
  read metadata). Prefer "App folder" access, so the app can see only its own folder and nothing else in their Dropbox. Tokens are
  short-lived with a refresh token, kept in Vercel's environment settings.
- **New uploads arrive by webhook:** Dropbox can notify our server when files change, so no polling.
- **Consent record:** no Google Sheet. Keep consent per file in our database and the Content Console approval step.
- **Rights and privacy:** unchanged from the Drive notes above. Dropbox goes on the privacy notice as a sub-processor.
- **The Claude app:** there is no Dropbox connector listed in this session, which does not matter for the automation (it uses the API),
  but means looking at the folder from a chat would mean a connector added later.
