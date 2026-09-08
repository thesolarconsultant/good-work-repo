# The platform — scope, decisions, order

Salon and clinic management to Phorest's standard, plus a consumer marketplace.
That is two products with different customers, different economics and a
dependency between them, so this file exists to keep the order honest.

## What we are actually up against

Phorest has run for roughly two decades and employs a few hundred people.
Fresha — the closest thing to what is being described here, software plus
marketplace — raised well over $100m to do it. Nothing below pretends to
compress that into a quarter. What it does is sequence the work so that every
stage is a sellable product on its own, and so the decisions that cannot be
reversed are made first.

The two-sided problem is the real risk, and it is commercial rather than
technical: salons will not list without consumers, and consumers will not come
without salons. Every marketplace that worked solved that by being genuinely
useful to one side before the other side existed. Which is the argument for
building the salon software first and well — a salon that already runs its day
on our calendar is a listing we get for free.

## Two decisions that cannot be deferred

Both are consequences of the marketplace, and both are why it cannot be bolted
on to a finished salon product later.

### 1. Services need a shared taxonomy behind the client's own names

A salon calls it "Luxe Hydrafacial 60". The one down the road calls it "Deep
Cleanse Facial". A consumer searching the marketplace for "facial" must find
both, and a salon must never be told what it is allowed to call its own menu.

So a service carries two identities: the tenant's — name, price, duration,
staff who perform it — and a link to a canonical marketplace category owned by
us. The tenant owns their words; we own the search axis.

Retrofitting this means mapping every service in every live workspace by hand,
which is a job nobody will ever be given budget for. It costs one column now.

### 2. Cross-tenant availability cannot be a live fan-out

"Botox in Cardiff, Saturday afternoon" has to answer in under a second. If each
salon's calendar is siloed behind its own tenant boundary, answering it means
querying every salon in Cardiff and computing slots for each — O(salons) per
search, and it collapses at a few hundred listings.

The marketplace therefore reads a **derived availability index**: a
denormalised, continuously-updated table of bookable slots, written whenever a
booking, shift or service changes. The tenant's calendar stays the source of
truth; the index is a cache that must be allowed to be briefly wrong, which
means the *confirm* step re-checks against the real calendar before it commits.

Consequence worth stating plainly: a marketplace booking can be offered and
then refused, and the UI has to be honest about that rather than pretend it
cannot happen.

## Build order

Each phase is something you could sell on its own.

**1 — The calendar.** Day view, column per staff member, drag to move, service
blocks that show processing gaps. Clients, services, staff, rooms, shifts.
This is where a salon spends eight hours a day; if it is not better than
Phorest's, nothing after it matters.

**2 — The client record.** History, treatment notes, consultation and consent
forms, before/after photos, allergies and contraindications. This is the point
at which we are holding health data (see below).

**3 — Money.** Deposits, POS, gift cards, packages and courses of treatment,
no-show handling. Salons switch software for this more than for anything else.

**4 — Retail and stock.** Products, stock levels, suppliers, reorder points.

**5 — Marketing.** Reminders, rebooking prompts, review requests, campaigns,
loyalty. Phorest's real moat is the reputation and rebooking automation, not
the calendar.

**6 — Online booking.** The salon's own booking page, on their domain. This is
the marketplace's engine with a single tenant in it — build it as such.

**7 — The marketplace.** Consumer accounts, search by service, location and
availability, reviews, deposits, commission. Only worth starting once phase 6
is running for real salons, because it is the same machinery pointed at many.

## Health data is a design constraint, not a compliance task

Aesthetics means treatment records, contraindications, medical history and
before/after photographs. Under UK GDPR that is special category data
(Article 9): it needs an explicit lawful basis, retention limits, encryption at
rest, and an audit trail of who opened a record and when.

Designed in at phase 2 this is a feature we can sell against incumbents and a
clean answer in a buyer's diligence. Retrofitted after real clinics have real
client notes in the system, it is a migration nobody can safely run.

## Where the code is

- `engine/fields.js` — field types, coercion and validation. Tested.
- `engine/schema.js` — client-defined objects and fields; `diffObject()` refuses
  to reshape a live workspace in a way that loses data. Tested.
- `engine/availability.js` — segments, conflicts and free slots. This is the
  arithmetic behind double-booking prevention, processing time and room
  turnaround, and it is the piece the whole product rests on. 17 tests.

Run them with `npm test`.

## Still open

- Which visual layout to follow (screenshots pending).
- Aesthetics clinics specifically, or salons generally — it changes how much of
  phase 2 is medical.
- Whether the buyer wants the marketplace as part of the sale, or the salon
  software alone with the marketplace as their expansion story.
