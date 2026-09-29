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
