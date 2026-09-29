# Beauty Heaven Hub: the plan so far

One page that pulls together everything decided in this session. The detail sits in the linked files.

## 1. What we are building (signed: £2,800 build, £398 a month)
- **Website, one site with two sides:** "I want a treatment" (browse and book through Phorest links; anything not bookable online goes to
  WhatsApp) and "I want to learn" (courses, and "ask about this course" opens WhatsApp with a message ready). Phone and a short form for
  people without WhatsApp. Only courses confirmed as running are listed. "Certificate of completion", not "accredited", until proven.
- **WhatsApp receptionist:** answers from one source of truth, books services into Phorest, sends consultations straight to the right
  practitioner, hands anything clinical to a person. Telegram as an optional extra channel (text only). No SMS bot.
- **Voice agent, fallback only:** answers out of hours and calls nobody picks up. Needs call forwarding from their phone provider.
- **Operator chat with Jess and Hollie:** weekly content check-in, approvals, the surprise-pillar questions. Walled off from clients.
- **Content Console:** templates, ideas, carousels, images, reels; one coordinator over separate agents; nothing posts without approval.
- **Content from Google Drive:** team drops photos and clips in `Inbox`, owners move the good ones to `Approved`, agents read only
  `Approved`, with a consent sheet. Consultation photos never go there.
- **Held back:** email templates (copy theirs from Phorest later), photo intake (waits for Part C), certificate template (only if they ask),
  own diary or marketplace or Academy platform (future, separate product).
Files: `receptionist-plan.md`, `content-pillars-workshop.md`.

## 2. Content
- **Four fixed pillars:** What actually happens; The people and the place; The Academy; Care and practical.
- **Fifth, the surprise pillar:** the bot asks three or four quick questions each week; the answers become that week's theme and a named series.
- **Bot name:** chosen with them (ideas: Halo, Angel, Cloud, Hebe, Honey). It always tells clients it is an AI.
- **Channels:** Instagram and Facebook, TikTok, YouTube (Shorts), Google Business. One reel cut for each, own caption, no watermarks.
- **Volume (decided):** 1 feed post a day, 1 Story a day, 3 reels a week, 2 blogs a week, approved in one weekly batch. Stories carry the
  promos. Real clips from the team over AI video.
- **Rules:** no results promises, no prices or offers for prescription-only treatments, consent for anyone shown.
Files: `content-pillars-workshop.md`, `content-idea-sheet.md`.

## 3. Tech and accounts
- **Stack:** Vercel (site, webhooks, scheduled jobs, London region) plus Supabase (London, paid plan, text only, row-level security).
- **Models:** the Anthropic API on a business account. Not a Claude subscription (the terms prohibit bots on consumer plans).
- **Ownership:** runs in Good Work's Vercel and Supabase, one project per client. Their domain, Meta, WhatsApp, socials, Google,
  Phorest and Stripe stay in their name, with Good Work invited. Second Good Work admin, 2-step sign-in everywhere.
- **Build on Telegram first, launch on WhatsApp.** Dry-run first; each piece can be switched off.
- **Their domain:** beautyheavenhub.co on GoDaddy DNS, site on Wix, email on Microsoft 365. Don't break the email records.
Files: `access-checklist.md`, `phorest-api.md`.

## 4. People, data and the practitioners
- **Part C of the interview decides** whether practitioners are truly independent. That shapes the photo design, the data agreement and
  any fee. Advice from their accountant or an employment adviser, not us.
- **Photos:** forward-only to the routed practitioner, nothing stored by us, consent first. Revisit after Part C.
- **Conversation records:** text transcripts kept with a notice, a retention period, access limits and deletion on request.
- **Data agreement** between Good Work and the salon, checked by a solicitor, sent as a short follow-up, not a reopened proposal.

## 5. Money
- **Running cost:** about £125 lean, £215 expected, excluding the Phorest API (unknown) and your time. Your margin about £195 a month.
- **Voice:** Bland Start is $0.14 a minute plus telephony; as a fallback it is probably £30 to £80 a month. Your friend's flat $200 is the
  alternative. Test both with the same calls.
- **Don't cut the £398 yet.** Review after three months of real usage and a monthly usage report.
- **VAT:** add a line now that prices exclude VAT and it will be added if you register.
- **Later, after the results:** practitioner membership or fee (salon-sourced clients only), and an Academy marketing pilot with a base
  fee plus a capped share of tagged enrolments, ad spend on their card.
Files: `running-costs.md`, `commercial-model.md`.

## 6. The Academy (what we found in L3 Matrix)
- Login is bh.13matrix.com; needs a computer or tablet. 101 library items, 39 course categories, 73 credits, students added by hand.
- Nothing in Certification, and an "Ofqual-regulated upgrade" upsell: probably not Ofqual-regulated. Don't say accredited until shown.
- Don't copy or rebuild L3 Matrix content; it may belong to Learn Group or trainers.
File: `discovery.md`.

## 7. Next steps
**Tomorrow (them):** Phorest API request first; limited logins for you on Phorest and L3 Matrix; YouTube Brand Account; TikTok business
account; Google Drive; introduce you to whoever holds the domain. Always "Manager", never "Owner". No passwords.
**Tomorrow (you):** send the pre-visit message; create Good Work's Meta Business portfolio and note the Business ID; print the visit pack.
**Thursday 11:00 (visit):** website questions (short list), Part C in full, the bookings part, 30-minute break, Meta and WhatsApp setup,
then the closing Academy question. About 80 to 90 minutes plus the break. Hand over the idea sheet at the end.
**Friday or Monday (call):** pillars, surprise series, bot name, tone and never-say lists, weekly rhythm.
**Outside our control:** Phorest's answer and cost, Meta verification, phone forwarding, owner sign-offs, advice on advertising rules.
**Can start now:** the website build, the Supabase tables, a Telegram prototype of the receptionist.
Files: `visit-pack.md`, `email-to-phorest.md`, `chatgpt-interview-prompt.md`.
