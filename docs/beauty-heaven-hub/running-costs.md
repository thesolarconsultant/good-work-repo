# Beauty Heaven Hub: what it costs to run each month

**Nothing here is a quoted price.** Every unit price below is blank, to be filled from the supplier's current price list before we
rely on it. The point is to see which lines can grow and to put a cap on each.

## What the signed proposal already promises
- £398 a month covers the writing engine, the chat assistant, the voice agent and **1,000 voice minutes**. "You are not going
  to get a bill from anyone but us."
- Outside it, only "genuinely unusual" things: SMS charges, phone use far beyond the included minutes, email at a volume no salon sends.
- Pictures (Higgsfield) are an optional add-on at about £80 a month.
- Running the socials, campaigns, ads and video are GOOD GROWTH, priced per client.

## Lines that cost money, and what makes each one grow
| Line | Unit | Unit price (check) | What makes it grow |
|---|---|---|---|
| Voice agent (phone number, speech-to-text, model, text-to-speech, platform) | per minute, all in | ___ | number of calls x call length |
| Model usage: WhatsApp receptionist | per conversation | ___ | messages per day, long chats, photos described |
| Model usage: content console and content agents | per item | ___ | blogs (target 4 to 6 a week), carousels, captions, reels scripts |
| WhatsApp Business messages | per message we start | ___ | reminders, follow-ups, alerts to practitioners (replies inside the 24-hour window are, as we understand it, free; confirm) |
| Image generation | per image | ___ | number of images (add-on) |
| Video generation, if AI video is used | per second or clip | ___ | 5 reels a week is the biggest risk line |
| Scheduler for posting (for example Upload-Post) | per month or per post | ___ | accounts and posts |
| Vercel (paid plan, per seat plus usage) | per month | ___ | seats, function time |
| Supabase (paid plan) | per month | ___ | database size, backups |
| Email sending (for example Resend) | per email | ___ | list size x campaigns |
| Phone number rental, domain | per month | ___ | fixed |

## How to keep the £398 honest
1. **Measure the first month** before forecasting. Log minutes, conversations and content items per week.
2. **Hard caps per line** (a monthly spend limit at each supplier, and an alert at 70%).
3. **Voice is the line to watch.** 1,000 minutes is a promise. At an all-in price per minute of P, the worst month costs
   1,000 x P. Fill P in before the voice agent goes live and check it still leaves margin.
4. **Video and blog volume are the other two.** Both are choices, not fixed costs. Blog volume and AI video are where
   the plan, not the platform, decides the bill.
5. **Say what sits outside the fee** before it happens: heavy call volume, extra channels, extra content, WhatsApp campaigns.
6. **A usage report per client** each month, so a price change or a busy month is visible early.

## Not in the proposal wording yet
WhatsApp message fees, the posting scheduler, blogs and reels at the volumes discussed, and photo-intake. Decide whether each
is covered by the £398 or sits under GOOD GROWTH.

## Voice: pay per minute versus a flat fee (user's figures, 2026-10-01; verify on the supplier's pricing page)
- Friend's company: about $200 a month, terms to confirm.
- Bland.ai: shown to the user at about $0.14 a minute on a plan labelled "100 calls a day". The daily figure is most likely a plan
  limit, not the salon's volume. Cost depends on **minutes**, not calls.
| Minutes a month | Cost at $0.14 a minute |
|---|---|
| 500 | $70 |
| 1,000 (the included allowance) | $140 |
| 1,500 | $210 |
| 2,000 | $280 |
- Break-even against $200 is about 1,430 minutes a month. One thousand minutes is about 33 minutes a day, roughly 11 to 16 calls
  a day at two to three minutes each. At 100 calls a day of two minutes each, cost would be about $840 a month.
- **To confirm before comparing:** what $0.14 includes (model, voice and phone, or only some), phone number rental, whether calls are
  rounded up per call, charges for transfers, failed or unanswered calls, monthly plan fees, UK number availability and call quality,
  data location and a data agreement.
- **Protect against spikes:** maximum call length, silence timeout, spam-call filtering, and a monthly spend cap with an alert.
- **Real volume:** the salon's calls per week and length are asked in interview B2. Use that, not a guess.

### What Bland's public pricing page says (read in this session; prices change, re-check before deciding)
- **Start:** $0.14 a minute, $0 platform fee, transfer minutes $0.05, 10 concurrent calls, **100 calls a day cap** (a plan limit, not a
  volume), an inbound number included in the sign-up credits (valued at $15 a month).
- **Build:** $0.12 a minute plus **$299 a month**, 2,000 calls a day, 50 concurrent calls.
- **The per-minute rate covers the model, speech-to-text and text-to-speech. Telephony is billed separately**, either Bland's Twilio at
  pass-through cost or your own carrier. So $0.14 is not all-in.
- **Marked as Enterprise-only on the comparison table** (not on Start or Build): warm and live transfers, guardrails ("protected calls"),
  alarm and monitoring, the appointment scheduling node, in-call SMS, **data residency**, BAA and SSO. Confirm whether a basic transfer
  to a human works on Start, since a transfer rate is listed.
- They state SOC 2, HIPAA-eligible with a BAA, GDPR and PCI compliance, and publish a DPA and a sub-processor list. Check that the DPA
  covers UK data transfers to the US and that call recordings and transcripts can be deleted on request.
- **Sums:** 1,000 minutes at $0.14 is $140 plus telephony and the number. Against a flat $200 the saving is small once telephony is
  added, and the flat fee may include things this plan does not. Compare like for like.

### Voice as a fallback only (user, 2026-10-01): out of hours and calls nobody answers
Staff stay the first line, so minutes should be low. At Bland's Start rate of $0.14 a minute, and an assumed average of 2.5 minutes a
call (an assumption, replace with real figures from interview B2), before number rental and telephony:
| Calls the agent takes each week | Minutes a month | Cost a month at $0.14 |
|---|---|---|
| 20 | about 220 | about $30 |
| 50 | about 540 | about $76 |
| 100 | about 1,080 | about $152 |
| 200 | about 2,170 | about $303 |
- Break-even against a flat $200 is about 130 calls a week at 2.5 minutes. Below that, per-minute is cheaper.
- At these volumes the fixed items (number, telephony, any plan fee) matter more than the minutes.
- Spam and robocalls hit an unanswered line hardest. Keep a maximum call length, a silence timeout and a monthly cap.
- **Dependency:** the phone provider must be able to forward calls that go unanswered or arrive out of hours (conditional forwarding).
  Ask in interview B2.
- **Wording:** the proposal says the agent "answers the calls that come in". A fallback-only role is narrower and lower risk. Say so to
  Jess and Hollie so they expect the front desk to remain first line.
- **When the agent cannot book:** it takes name, number and what they want, and a person calls back the next morning (the salon to
  confirm the promised time).

## Estimate of the monthly running cost (Claude's estimate, 2026-10-01; not quotes)
Excludes the user's time and the optional images add-on. Rough pounds; exchange rates move. Subscription prices are from memory
(Vercel Pro about $20 a seat, Supabase Pro about $25, Resend paid about $20): check each.
| Line | Lean | Expected | Busy |
|---|---|---|---|
| Voice, fallback only (about 20 / 50 / 100+ calls a week) | £25 | £60 | £120 |
| Model usage: receptionist chats | £15 | £35 | £80 |
| Model usage: content (blogs, captions, ideas) | £10 | £20 | £40 |
| WhatsApp messages we start | £5 | £15 | £30 |
| Vercel | £16 | £16 | £30 |
| Supabase | £20 | £20 | £20 |
| Posting scheduler | £10 | £20 | £30 |
| Email sending | £15 | £15 | £25 |
| Phone number, telephony, domain | £10 | £15 | £20 |
| **Total** | **about £125** | **about £215** | **about £395** |
- **Not included:** AI video (could add £50 to £300 or more a month at 5 reels a week; avoid by using practitioners' clips) and the
  images add-on.
- **Time:** setup is large. Ongoing work (monitoring, approvals, fixes, the monthly report) might be 4 to 8 hours a month. At £50 an
  hour that is £200 to £400, which is why £398 leaves little or no margin once time is counted, especially in the first three months.
- **Biggest swings:** voice volume, content volume, and any AI video.
