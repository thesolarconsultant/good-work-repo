# Beauty Heaven Hub: access we need, and how to get it safely

**Rule: nobody sends a password, in any message, ever.** Each account owner (Jess or Hollie) invites a Good Work address from
inside the platform, with the smallest role that does the job. They keep their own 2-step sign-in. We note what was granted and when,
and remove it when the work ends. Good Work should use a shared team address, not a personal one, and keep a second person on it.

| # | What | Who holds it | What we ask for | Needed for |
|---|---|---|---|---|
| 1 | Domain and DNS (beautyheavenhub.co and .co.uk, whichever they own) | ? (interview A14) | Delegate or manager access at the registrar, or they add the DNS records we give them | Website, email sending records |
| 2 | Current Wix site | ? | A collaborator invite with limited rights | Content, redirects, launch |
| 3 | Phorest | Jess | She requests Third Party API access from Phorest support and passes us the credentials through a password manager share, not chat. No manager login for us. | Booking, availability, clients |
| 4 | Meta Business portfolio | Jess (to create) | Partner access for Good Work; task access to the Facebook page and Instagram | WhatsApp Business account, posting |
| 5 | WhatsApp Business account and number | Jess (to create in the portfolio) | Admin on the account in their portfolio | Client and staff assistant |
| 6 | Google Business Profile, Analytics, Search Console | ? | Manager or user invites | Site, reviews, search |
| 7 | Social accounts to post to: Instagram and Facebook (Meta), TikTok, YouTube | ? | Each in the salon's name, with **two owners** (Jess and Hollie). TikTok: a business account. YouTube: a **Brand Account** channel so managers can be added without sharing a login. Each connected to the posting scheduler by an owner signing in themselves. | Scheduled content |
| 8 | Phone provider | ? | An authorised person asks for call forwarding to the voice agent number | Voice agent |
| 9 | Consultation app | ? | Its name, and read-only access if it stays | Consultation and consent records |
| 10 | L3 Matrix | Jess | A view-only or learner account by invitation | Academy pages, post-deposit email |

Not needed now: card-payment accounts. Treatment payments run through Phorest.

## Message for Jess (edit and send)
> Hi Jess, thanks again for getting started. To build everything we'll need to be added to a few accounts. **Please don't send us
> any passwords.** Each one is done by inviting us from inside the account, and you stay in control and can remove us any time.
> Could you set aside 30 minutes so we can go through it together on a call? The list: your domain (who holds it?), the current Wix
> site, your Google Business Profile, Facebook and Instagram, and a new WhatsApp Business account for the assistant, which we'll
> walk you through creating. And when you're ready, the email to Phorest asking for API access, which I'll send you the wording for.
> I'll write down exactly what we've been given and when.

## Doing it in person (decided 2026-10-01)
Jess or Hollie do every click on their own phone or laptop. We watch, and we never log in as them or take a password.

**Have ready before you start**
- Phones charged and to hand (login codes), and a charger.
- **For Meta business verification:** the legal business name, the address, and a company number, VAT number or recent utility bill in the
  business's name. Also one email address at their own domain to use for the account. They have three, so pick the real one.
- **The WhatsApp number.** Start with a **new dedicated number** for the assistant (it cannot already be registered on the ordinary
  WhatsApp app). Decide later whether to move the main salon number across, and check whether Meta lets the Business app and the
  assistant share a number.
- **For the Phorest request:** Jess sends it from the address that is on the Phorest account, with the account number.
- Who holds the domain, Google and Wix logins (interview A14), or their names so we can chase them.

**Order:** Meta Business portfolio and WhatsApp Business account first (verification takes days), then Phorest email, then Google and
Facebook and Instagram partner access, then the domain, then the rest.

**Phorest and L3 Matrix:** ask each of them to create a separate limited user for Good Work, and don't use Jess's own login.
Tick each item off the table above as it is done and note the date.

### Channels decided so far: Meta (Facebook and Instagram), TikTok, YouTube, Google Business Profile
- **Check before promising:** what the chosen scheduler supports on each (Instagram Reels, TikTok, YouTube Shorts, Google Business posts).
  TikTok in particular has approval rules for apps that post on someone's behalf, so posts through an unapproved tool may be private only.
- **Repurpose, don't duplicate:** one reel cut for Instagram, Facebook, TikTok and YouTube Shorts, each with its own caption, exported
  clean (no other platform's watermark). Google Business gets a short post with a photo and a booking link.
- **The advertising rules for prescription-only treatments apply on every platform.**
- **Two owners on every account**, and 2-step sign-in on each.

## What public DNS records show (looked up in this session; no logins used)
- **beautyheavenhub.co:** name servers ns53 and ns54.domaincontrol.com (GoDaddy's DNS), website address pointing at 185.230.63.107 (a Wix
  address range), and **email routed to Microsoft 365** (MX to beautyheavenhub-co.mail.protection.outlook.com).
- **beautyheavenhub.co.uk:** name servers ns09 and ns10.domaincontrol.com (GoDaddy DNS), pointing at 3.33.130.190 and 15.197.148.33 (looks like a
  parked or forwarding page), and **no email records**.
- **Reading it:** the domain is probably registered at GoDaddy, the site is on Wix, and staff email is on Microsoft 365. The registrar and the
  registrant could not be confirmed (registration records were not available).
- **Care needed:** when we add records for our own sending (SPF, DKIM), we must not remove or overwrite the Microsoft 365 email records, or
  the salon's email stops working. Change nothing in DNS without a copy of the current records first.
- **Questions for Jess:** who set the domain up, and whose name is it registered in? Which of the two domains is the main one (the site says .co)?
- **Getting in:** only the account holder can act at the registrar. Ask them for delegate access, or to add the records we give them. If the
  domain is in someone else's name, get that person's written OK. Ask the registrant to move it into the salon's name if it isn't.

## Replies from Jess (2026-09-30)
- **Meta Business:** already verified. Still to do: WhatsApp Business account in the portfolio (new number, display name approval), and
  partner access for Good Work.
- **L3 Matrix:** only one admin login exists; everything else is student access. Decision: Jess keeps admin. Ask for a **student account**
  for Good Work to see the learner journey; anything admin-side, Jess shows us on screen.
- **Phorest:** Jess will add a Good Work user when she is in the salon.
- **Website and domain:** Jess holds full access herself (no separate web person). Likely GoDaddy for the domain and Wix for the site.
  Ask her to invite Good Work: GoDaddy "Delegate access" and a Wix site collaborator. Don't touch the Microsoft 365 email records.
- **Google Drive:** Jess setting it up today.
- **Wix: not used going forward (user, 2026-09-30).** The new site runs on Vercel. No Wix collaborator access needed; content is copied
  from the public site. At launch: point the domain at Vercel from GoDaddy, redirect old Wix page addresses to the new pages, and keep the
  Wix plan until the new site is live and checked. Before cancelling, check nothing else runs on Wix (forms, the online-courses store,
  any bookings or email) and that the domain itself is not registered through Wix.
