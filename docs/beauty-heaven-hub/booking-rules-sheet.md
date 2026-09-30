# Beauty Heaven Hub: booking rules sheet

The website, and later the WhatsApp and phone assistants, will only offer times that follow these rules. **A booking they make is
final**, so the rules must be right. One sheet per person. Anything left blank means "no limit". Fill it in on Thursday (question
B16), or send the WhatsApp version below to each person.

People who show on online booking in Phorest today: Anastasia, Autumn, Ellie-Mae, Gracie, Hollie, Jessica, Louise, Nikki, Rosie
(plus the two sunbeds, which Phorest treats as staff). Check nobody is missing.

## For each person

| Rule | Answer |
|---|---|
| Name (as in Phorest) | |
| Days they take bookings | |
| Earliest start | |
| Must **finish** by (normal days) | |
| Any day that's different (late night, half day), and its times | |
| Breaks or lunch that must stay free | |
| Treatments they only do at certain times, or never online | |
| Anything else a booking must never do for them | |

## For everyone

| Rule | Answer |
|---|---|
| Shortest notice for an online booking (hours) | |
| Furthest ahead someone can book (days or weeks) | |
| Treatments new clients can't book online until a first visit or consultation | |
| Treatments that need a patch test first, and how long before | |
| Treatments that need a deposit (Phorest's settings set the amount) | |
| Treatments the team always books themselves (never confirmed online) | |
| Are these already set in Phorest's online booking settings? | |

## WhatsApp version (one per person)

```
*Booking rules for the new website* ✨
The website will only offer times that fit these, so please be exact 🙏

*Name:*
*Days you take bookings:*
*Earliest start:*
*Time you must FINISH by:*
*Any day that's different (late night / half day):*
*Breaks or lunch to keep free:*
*Treatments only at certain times, or never online:*
*Anything else a booking should never do:*
```

## Where the answers go
`sites/beauty-heaven-hub/data/booking-rules.json`: `everyone` for the salon-wide rules, `people` by first name, `byDay` for a
different day, `deposits` and `teamOnly` by treatment section. The build refuses a name or section it can't match. If Phorest's
own online settings can hold the same rule, set it there too, so Phorest's booking page agrees.
