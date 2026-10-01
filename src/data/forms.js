// =========================================================
// Enquiry forms — one schema per intention.
//
// Each form here is rendered by <EnquiryForm>, validated in the browser by
// lib/forms.js and validated again by api/enquiry.js, which reads the same
// `required` flags from its own copy of these names. Field `name`s are the
// keys that reach the CRM, so they are stable, flat and human-readable, and a
// field's `label` is what heads its line in the plain-text summary that lands
// in the inbox.
//
// Types: text | email | tel | url | select | textarea | checkbox-group |
//        radio | checkbox
//
// Presentation only (never sent, never validated server-side):
//   placeholder   an example in the empty field ("e.g. …")
//   ui: "chips"   a single choice shown as compact chips rather than cards
//   tokens        quick-pick chips for a textarea; each toggles a comma-
//                 separated item in the text, which stays freely editable
//   stages        quick-pick pipeline stages, joined with arrows
//
// `steps` turns a form into a conversation: one short screen at a time, in
// order, then a review of exactly what will be sent. A step's `kicker` and
// `title` may be functions of the answers so far, which is how it uses your
// name once it has it. `short` labels the step on the progress rail. Every
// field belongs to exactly one step.
// =========================================================

import { gbp } from "../lib/format.js";

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
];

const LAUNCH_WINDOWS = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-2-months", label: "Within one to two months" },
  { value: "quarter", label: "Within three months" },
  { value: "exploring", label: "No date yet, exploring" },
];

/** The first word of the name given, or "". */
export const firstName = (v) => String(v?.name || "").trim().split(/\s+/)[0] || "";
const hello = (v, otherwise) => (firstName(v) ? `Nice to meet you, ${firstName(v)}` : otherwise);
const almost = (v) => (firstName(v) ? `Almost there, ${firstName(v)}` : "Almost there");
const theBusiness = (v) => String(v?.business || "").trim() || "the business";

export const FORMS = {
  built: {
    id: "built",
    title: "Built by Goodwork enquiry",
    intro: `Tell us about the business and what it needs. We confirm the scope and the fixed ${gbp(2800)} implementation fee before anything starts.`,
    submitLabel: "Send the enquiry",
    successTitle: "That's with us.",
    doneTitle: (v) => (firstName(v) ? `That's with us, ${firstName(v)}.` : "That's with us."),
    successCopy: "We'll come back within one working day with any questions, then a written scope. Nothing starts until you've agreed it.",
    next: ["A reply from a person within one working day, with any questions.", `Then a written scope with the fixed ${gbp(2800)} fee.`, "Nothing starts until you've agreed it."],
    event: "service_enquiry_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name", placeholder: "Jane Smith" },
      { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization", placeholder: "e.g. Smith & Co Plumbing" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "jane@smithandco.co.uk" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel", placeholder: "07700 900123" },
      { name: "website", label: "Current website", type: "url", hint: "Leave blank if there isn't one", autoComplete: "url", placeholder: "smithandco.co.uk" },
      {
        name: "sells",
        label: "What does the business sell?",
        type: "textarea",
        required: true,
        rows: 3,
        hint: "Who buys it, and roughly how",
        placeholder: "e.g. Boiler installs and servicing for homeowners in Leeds, mostly from Google and referrals.",
      },
      {
        name: "pages",
        label: "Pages you think you need",
        type: "checkbox-group",
        options: [
          { value: "home", label: "Home" },
          { value: "services", label: "Services or products" },
          { value: "about", label: "About" },
          { value: "pricing", label: "Pricing" },
          { value: "showcase", label: "Work or gallery" },
          { value: "blog", label: "Blog or articles" },
          { value: "contact", label: "Contact" },
          { value: "other", label: "Something else" },
        ],
      },
      {
        name: "systems",
        label: "Systems you want configured",
        type: "checkbox-group",
        options: [
          { value: "whatsapp", label: "WhatsApp bot flow" },
          { value: "voice", label: "AI voice-agent flow" },
          { value: "console", label: "Content Console" },
          { value: "crm", label: `Embedded CRM (add-on, ${gbp(1888)} one-time)` },
          { value: "brand", label: "Brand-guideline document" },
        ],
      },
      {
        name: "brandStatus",
        label: "Where is the brand at?",
        type: "radio",
        required: true,
        options: [
          { value: "settled", label: "Settled: logo, colours and type are agreed" },
          { value: "partial", label: "Partly there: a logo, not much else" },
          { value: "none", label: "Starting from scratch" },
        ],
      },
      { name: "launch", label: "Target launch", type: "select", required: true, ui: "chips", options: LAUNCH_WINDOWS },
      {
        name: "budgetConfirmed",
        label: `I understand the implementation fee is ${gbp(2800)} one-time, and that hosting, messaging, telephony and AI usage are charged separately.`,
        type: "checkbox",
        required: true,
        requiredMessage: "Please confirm you've read the fee and what sits outside it.",
      },
      { name: "contactMethod", label: "Preferred contact method", type: "radio", required: true, ui: "chips", options: CONTACT_METHODS },
      {
        name: "notes",
        label: "Anything else",
        type: "textarea",
        rows: 4,
        hint: "Deadlines, integrations, things already tried",
        tokens: ["A fixed deadline", "Integrations to keep", "Replacing an existing site", "Tried this before"],
      },
    ],
    steps: [
      { id: "you", short: "You", kicker: "Start your build", title: "First, who are we talking to?", fields: ["name", "business"] },
      {
        id: "business",
        short: "Business",
        kicker: (v) => hello(v, "The business"),
        title: (v) => `What does ${theBusiness(v)} sell?`,
        help: "A sentence or two is plenty: what it sells, who buys it, and roughly how they find you.",
        fields: ["sells", "website"],
      },
      { id: "pages", short: "Pages", kicker: "The website", title: "Which pages do you think you'll need?", help: "Pick as many as you like. It's a starting point for the scope, not a commitment.", fields: ["pages"] },
      {
        id: "systems",
        short: "Systems",
        kicker: "The systems",
        title: "Which systems should we set up?",
        help: `Each is included once in the ${gbp(2800)} build, except the Embedded CRM, which is a ${gbp(1888)} add-on. Skip any you don't need.`,
        fields: ["systems"],
      },
      { id: "brand", short: "Brand", kicker: "The brand", title: "Where's the brand at?", fields: ["brandStatus"] },
      { id: "launch", short: "Launch", kicker: "Timing", title: "When would you like to launch?", fields: ["launch"] },
      { id: "reach", short: "Contact", kicker: almost, title: "How should we reach you?", fields: ["email", "phone", "contactMethod"] },
      { id: "final", short: "Last bits", kicker: "Last thing", title: "Anything else we should know?", help: "Tap anything that applies and add detail in your own words. Then one confirmation and you're done.", fields: ["notes", "budgetConfirmed"] },
    ],
  },

  crm: {
    id: "crm",
    title: "Embedded CRM enquiry",
    intro: `The ${gbp(1888)} one-time fee covers implementation. Your server and communication costs stay separate, so tell us how you'd like it hosted.`,
    submitLabel: "Send the enquiry",
    successTitle: "That's with us.",
    doneTitle: (v) => (firstName(v) ? `That's with us, ${firstName(v)}.` : "That's with us."),
    successCopy: "We'll come back within one working day to confirm the pipeline, the integrations and the hosting route before anything is set up.",
    next: ["A reply from a person within one working day.", "We confirm the pipeline, the integrations and the hosting route.", "Nothing is set up until that's agreed."],
    event: "service_enquiry_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name", placeholder: "Jane Smith" },
      { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization", placeholder: "e.g. Smith & Co Plumbing" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "jane@smithandco.co.uk" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel", placeholder: "07700 900123" },
      {
        name: "users",
        label: "Number of users",
        type: "select",
        required: true,
        ui: "chips",
        options: [
          { value: "1", label: "Just me" },
          { value: "2-5", label: "2 to 5" },
          { value: "6-15", label: "6 to 15" },
          { value: "16+", label: "16 or more" },
        ],
      },
      { name: "currentCrm", label: "Current CRM, if any", type: "text", hint: "HubSpot, GoHighLevel, a spreadsheet, nothing", placeholder: "e.g. A Google Sheet" },
      { name: "dataSource", label: "Where is your customer data now, and roughly how many records?", type: "textarea", rows: 3, placeholder: "e.g. About 1,200 contacts across a spreadsheet and an inbox." },
      {
        name: "pipeline",
        label: "Pipeline stages you need",
        type: "textarea",
        required: true,
        rows: 2,
        hint: "For example: New, Qualified, Quoted, Won, Lost",
        placeholder: "Or type your own, in order: New → Booked → Done",
        stages: ["New", "Contacted", "Qualified", "Site visit", "Quoted", "Won", "Lost"],
      },
      {
        name: "connections",
        label: "Forms and tools that need connecting",
        type: "textarea",
        rows: 3,
        hint: "Website forms, WhatsApp, booking, invoicing",
        tokens: ["Website forms", "WhatsApp", "Calendar booking", "Invoicing", "Email"],
      },
      {
        name: "automations",
        label: "Automations you want",
        type: "textarea",
        rows: 3,
        hint: "Follow-ups, task creation, status notifications",
        tokens: ["Follow-up reminders", "Task creation", "Status notifications", "Welcome emails"],
      },
      {
        name: "hosting",
        label: "Server preference",
        type: "radio",
        required: true,
        options: [
          { value: "self", label: "Customer-managed: we run it on our own server" },
          { value: "goodwork", label: "Goodwork-managed: host and maintain it for us (monthly plan)" },
          { value: "unsure", label: "Not sure yet" },
        ],
      },
      { name: "contactMethod", label: "Preferred contact method", type: "radio", required: true, ui: "chips", options: CONTACT_METHODS },
      { name: "notes", label: "Anything else", type: "textarea", rows: 3, placeholder: "Deadlines, things you've tried, anything that worries you." },
    ],
    steps: [
      { id: "you", short: "You", kicker: "Discuss your CRM", title: "First, who are we talking to?", fields: ["name", "business"] },
      { id: "users", short: "Team", kicker: (v) => hello(v, "Your team"), title: (v) => `How many people at ${theBusiness(v)} will use it?`, fields: ["users"] },
      { id: "now", short: "Today", kicker: "Where you are now", title: "What are you using today?", help: "A spreadsheet, an inbox or nothing at all is completely normal.", fields: ["currentCrm", "dataSource"] },
      { id: "pipeline", short: "Pipeline", kicker: "The pipeline", title: "Sketch the pipeline.", help: "Tap the stages a lead moves through, in order. Rename or add your own in the box.", fields: ["pipeline"] },
      { id: "connect", short: "Connections", kicker: "Connections", title: "What should it connect to, and what should it do by itself?", help: "Tap what applies, then add detail in your own words. Both optional.", fields: ["connections", "automations"] },
      { id: "hosting", short: "Hosting", kicker: "Hosting", title: "Where should it live?", help: `The ${gbp(1888)} fee covers implementation. The server is separate either way.`, fields: ["hosting"] },
      { id: "reach", short: "Contact", kicker: almost, title: "How should we reach you?", fields: ["email", "phone", "contactMethod"] },
      { id: "final", short: "Last bits", kicker: "Last thing", title: "Anything else we should know?", help: "Optional.", fields: ["notes"] },
    ],
  },

  agency: {
    id: "agency",
    title: "Agency programme application",
    intro: `The programme is ${gbp(8888.88)} paid in full, or four payments of ${gbp(2222.22)} subject to agreement and contract. Applications are reviewed by a person, not a form.`,
    submitLabel: "Submit the application",
    successTitle: "Application received.",
    doneTitle: (v) => (firstName(v) ? `Application received. Thanks, ${firstName(v)}.` : "Application received."),
    successCopy: "We read every application properly and reply within two working days. If it looks like a fit, the next step is a conversation, not an invoice.",
    next: ["We read every application properly.", "A reply within two working days.", "If it looks like a fit, the next step is a conversation, not an invoice."],
    event: "agency_application_submit",
    fields: [
      { name: "name", label: "Applicant name", type: "text", required: true, autoComplete: "name", placeholder: "Jane Smith" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "jane@northline.studio" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel", placeholder: "07700 900123" },
      { name: "agencyName", label: "Agency name, if you have one", type: "text", autoComplete: "organization", placeholder: "e.g. Northline Studio" },
      {
        name: "stage",
        label: "Existing or new agency?",
        type: "radio",
        required: true,
        options: [
          { value: "existing", label: "Existing agency" },
          { value: "new", label: "Starting a new agency" },
          { value: "pivot", label: "Freelance or consultancy moving to an agency model" },
        ],
      },
      { name: "services", label: "Current services", type: "textarea", required: true, rows: 3, hint: "What you sell today, or plan to", placeholder: "e.g. Websites and Google Ads for trades businesses." },
      {
        name: "revenue",
        label: "Current monthly revenue band",
        type: "select",
        required: true,
        ui: "chips",
        options: [
          { value: "pre", label: "Pre-revenue" },
          { value: "0-2k", label: "Under £2,000" },
          { value: "2-5k", label: "£2,000 to £5,000" },
          { value: "5-15k", label: "£5,000 to £15,000" },
          { value: "15-40k", label: "£15,000 to £40,000" },
          { value: "40k+", label: "Over £40,000" },
        ],
      },
      { name: "idealClients", label: "Ideal clients", type: "textarea", required: true, rows: 3, hint: "Sector, size, the problem you solve for them", placeholder: "e.g. Independent trades firms of 5 to 20 staff who lose leads after hours." },
      { name: "leadSources", label: "Current lead sources", type: "textarea", rows: 2, hint: "Referrals, ads, content, outbound, none yet", tokens: ["Referrals", "Paid ads", "Content", "Outbound", "None yet"] },
      { name: "team", label: "Existing team", type: "text", hint: "Just you, two of you, contractors", placeholder: "e.g. Me plus two freelancers" },
      { name: "constraint", label: "Biggest operational constraint", type: "textarea", required: true, rows: 3, hint: "The thing that stops you taking on more work", placeholder: "e.g. Every project is bespoke, so delivery stalls past three clients." },
      { name: "launch", label: "Desired launch date", type: "select", required: true, ui: "chips", options: LAUNCH_WINDOWS },
      {
        name: "investmentConfirmed",
        label: `I understand the programme is a ${gbp(8888.88)} investment and that hosting, telephony, messaging and AI usage for the agency and its clients are charged separately.`,
        type: "checkbox",
        required: true,
        requiredMessage: "Please confirm you understand the investment before applying.",
      },
      {
        name: "paymentRoute",
        label: "Preferred payment route",
        type: "radio",
        required: true,
        options: [
          { value: "full", label: `${gbp(8888.88)} paid in full` },
          { value: "instalments", label: `Four payments of ${gbp(2222.22)}, subject to agreement and contract` },
        ],
      },
      { name: "notes", label: "Anything else we should know", type: "textarea", rows: 4, placeholder: "Anything that would help us judge fit." },
    ],
    steps: [
      { id: "you", short: "You", kicker: "Apply to build your agency", title: "First, who's applying?", fields: ["name", "agencyName"] },
      { id: "stage", short: "Stage", kicker: (v) => hello(v, "Where you are"), title: "Where are you starting from?", fields: ["stage"] },
      { id: "services", short: "Services", kicker: "What you sell", title: "What do you sell, and who does the work?", fields: ["services", "team"] },
      { id: "revenue", short: "Revenue", kicker: "Revenue", title: "Roughly what comes in each month?", help: "A band is fine.", fields: ["revenue"] },
      { id: "clients", short: "Clients", kicker: "Clients", title: "Who are your ideal clients, and where do leads come from now?", fields: ["idealClients", "leadSources"] },
      { id: "constraint", short: "Constraint", kicker: "The constraint", title: "What stops you taking on more work?", fields: ["constraint"] },
      { id: "launch", short: "Launch", kicker: "Timing", title: "When do you want to launch?", fields: ["launch"] },
      { id: "investment", short: "Investment", kicker: "The investment", title: "How would you like to pay?", help: "Either way, hosting, telephony, messaging and AI usage are charged separately.", fields: ["paymentRoute", "investmentConfirmed"] },
      { id: "reach", short: "Contact", kicker: almost, title: "How should we reach you?", fields: ["email", "phone"] },
      { id: "final", short: "Last bits", kicker: "Last thing", title: "Anything else we should know?", help: "Optional.", fields: ["notes"] },
    ],
  },

  contact: {
    id: "contact",
    title: "General enquiry",
    intro: "Not sure which route fits? Tell us what you're trying to do and we'll point you at the right one, honestly.",
    submitLabel: "Send",
    successTitle: "Sent.",
    doneTitle: (v) => (firstName(v) ? `Sent. Thanks, ${firstName(v)}.` : "Sent."),
    successCopy: "We'll come back to you within one working day.",
    event: "contact_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name", placeholder: "Jane Smith" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "jane@business.co.uk" },
      { name: "business", label: "Business", type: "text", autoComplete: "organization", placeholder: "e.g. Smith & Co Plumbing" },
      {
        name: "topic",
        label: "What is this about?",
        type: "select",
        required: true,
        options: [
          { value: "library", label: "Goodwork Library (£280)" },
          { value: "studio", label: "Goodwork Studio (£888)" },
          { value: "built", label: "Built by Goodwork (£2,800)" },
          { value: "crm", label: "Embedded CRM (£1,888)" },
          { value: "agency", label: "Agency programme (£8,888.88)" },
          { value: "managed", label: "Managed infrastructure" },
          { value: "licence", label: "Licensing question" },
          { value: "other", label: "Something else" },
        ],
      },
      { name: "message", label: "Your message", type: "textarea", required: true, rows: 5, placeholder: "What are you trying to do, and what's in the way?" },
    ],
    steps: [
      { id: "topic", short: "Topic", kicker: "Talk to Goodwork", title: "What's this about?", fields: ["topic"] },
      { id: "message", short: "Message", kicker: "In your own words", title: "What are you trying to do?", help: "The more we know, the straighter the answer.", fields: ["message"] },
      { id: "you", short: "You", kicker: "Last bit", title: "Who should we reply to?", fields: ["name", "email", "business"] },
    ],
  },

  access: {
    id: "access",
    title: "Library access interest",
    intro: "Online checkout and customer access are being switched on with the Library release. Leave an email and we'll tell you the moment they're live. Nothing is charged.",
    submitLabel: "Tell me when it's live",
    successTitle: "Noted.",
    successCopy: "We'll email you once checkout and accounts are open. No marketing sequence, just that.",
    event: "access_interest",
    fields: [
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      {
        name: "product",
        label: "Which product?",
        type: "radio",
        required: true,
        options: [
          { value: "library", label: "Goodwork Library, £280 one-time" },
          { value: "studio", label: "Goodwork Studio, £888 one-time" },
          { value: "undecided", label: "Not decided yet" },
        ],
      },
    ],
  },
};

export const FORM_IDS = Object.keys(FORMS);
