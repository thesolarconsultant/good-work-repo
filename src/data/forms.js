// =========================================================
// Enquiry forms — one schema per intention.
//
// Each form here is rendered by <EnquiryForm>, validated in the browser by
// lib/forms.js and validated again by api/enquiry.js, which reads the same
// `required` flags from its own copy of these names. Field `name`s are the
// keys that reach the CRM, so they are stable, flat and human-readable.
//
// Types: text | email | tel | url | select | textarea | checkbox-group |
//        radio | checkbox
// =========================================================

import { gbp } from "../lib/format";

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

export const FORMS = {
  built: {
    id: "built",
    title: "Built by Goodwork enquiry",
    intro: `Tell us about the business and what it needs. We confirm the scope and the fixed ${gbp(2800)} implementation fee before anything starts.`,
    submitLabel: "Send the enquiry",
    successTitle: "That's with us.",
    successCopy: "We'll come back within one working day with any questions, then a written scope. Nothing starts until you've agreed it.",
    event: "service_enquiry_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
      { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel" },
      { name: "website", label: "Current website", type: "url", hint: "Leave blank if there isn't one", autoComplete: "url" },
      { name: "sells", label: "What does the business sell?", type: "textarea", required: true, rows: 3, hint: "Who buys it, and roughly how" },
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
      { name: "launch", label: "Target launch", type: "select", required: true, options: LAUNCH_WINDOWS },
      {
        name: "budgetConfirmed",
        label: `I understand the implementation fee is ${gbp(2800)} one-time, and that hosting, messaging, telephony and AI usage are charged separately.`,
        type: "checkbox",
        required: true,
        requiredMessage: "Please confirm you've read the fee and what sits outside it.",
      },
      { name: "contactMethod", label: "Preferred contact method", type: "radio", required: true, options: CONTACT_METHODS },
      { name: "notes", label: "Anything else", type: "textarea", rows: 4, hint: "Deadlines, integrations, things already tried" },
    ],
  },

  crm: {
    id: "crm",
    title: "Embedded CRM enquiry",
    intro: `The ${gbp(1888)} one-time fee covers implementation. Your server and communication costs stay separate, so tell us how you'd like it hosted.`,
    submitLabel: "Send the enquiry",
    successTitle: "That's with us.",
    successCopy: "We'll come back within one working day to confirm the pipeline, the integrations and the hosting route before anything is set up.",
    event: "service_enquiry_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
      { name: "business", label: "Business name", type: "text", required: true, autoComplete: "organization" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel" },
      {
        name: "users",
        label: "Number of users",
        type: "select",
        required: true,
        options: [
          { value: "1", label: "Just me" },
          { value: "2-5", label: "2 to 5" },
          { value: "6-15", label: "6 to 15" },
          { value: "16+", label: "16 or more" },
        ],
      },
      { name: "currentCrm", label: "Current CRM, if any", type: "text", hint: "HubSpot, GoHighLevel, a spreadsheet, nothing" },
      { name: "dataSource", label: "Where is your customer data now, and roughly how many records?", type: "textarea", rows: 3 },
      { name: "pipeline", label: "Pipeline stages you need", type: "textarea", required: true, rows: 3, hint: "For example: New, Qualified, Quoted, Won, Lost" },
      { name: "connections", label: "Forms and tools that need connecting", type: "textarea", rows: 3, hint: "Website forms, WhatsApp, booking, invoicing" },
      { name: "automations", label: "Automations you want", type: "textarea", rows: 3, hint: "Follow-ups, task creation, status notifications" },
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
      { name: "contactMethod", label: "Preferred contact method", type: "radio", required: true, options: CONTACT_METHODS },
      { name: "notes", label: "Anything else", type: "textarea", rows: 3 },
    ],
  },

  agency: {
    id: "agency",
    title: "Agency programme application",
    intro: `The programme is ${gbp(8888.88)} paid in full, or four payments of ${gbp(2222.22)} subject to agreement and contract. Applications are reviewed by a person, not a form.`,
    submitLabel: "Submit the application",
    successTitle: "Application received.",
    successCopy: "We read every application properly and reply within two working days. If it looks like a fit, the next step is a conversation, not an invoice.",
    event: "agency_application_submit",
    fields: [
      { name: "name", label: "Applicant name", type: "text", required: true, autoComplete: "name" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "phone", label: "Telephone", type: "tel", required: true, autoComplete: "tel" },
      { name: "agencyName", label: "Agency name, if you have one", type: "text", autoComplete: "organization" },
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
      { name: "services", label: "Current services", type: "textarea", required: true, rows: 3, hint: "What you sell today, or plan to" },
      {
        name: "revenue",
        label: "Current monthly revenue band",
        type: "select",
        required: true,
        options: [
          { value: "pre", label: "Pre-revenue" },
          { value: "0-2k", label: "Under £2,000" },
          { value: "2-5k", label: "£2,000 to £5,000" },
          { value: "5-15k", label: "£5,000 to £15,000" },
          { value: "15-40k", label: "£15,000 to £40,000" },
          { value: "40k+", label: "Over £40,000" },
        ],
      },
      { name: "idealClients", label: "Ideal clients", type: "textarea", required: true, rows: 3, hint: "Sector, size, the problem you solve for them" },
      { name: "leadSources", label: "Current lead sources", type: "textarea", rows: 2, hint: "Referrals, ads, content, outbound, none yet" },
      { name: "team", label: "Existing team", type: "text", hint: "Just you, two of you, contractors" },
      { name: "constraint", label: "Biggest operational constraint", type: "textarea", required: true, rows: 3, hint: "The thing that stops you taking on more work" },
      { name: "launch", label: "Desired launch date", type: "select", required: true, options: LAUNCH_WINDOWS },
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
      { name: "notes", label: "Anything else we should know", type: "textarea", rows: 4 },
    ],
  },

  contact: {
    id: "contact",
    title: "General enquiry",
    intro: "Not sure which route fits? Tell us what you're trying to do and we'll point you at the right one, honestly.",
    submitLabel: "Send",
    successTitle: "Sent.",
    successCopy: "We'll come back to you within one working day.",
    event: "contact_submit",
    fields: [
      { name: "name", label: "Your name", type: "text", required: true, autoComplete: "name" },
      { name: "email", label: "Email", type: "email", required: true, autoComplete: "email" },
      { name: "business", label: "Business", type: "text", autoComplete: "organization" },
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
      { name: "message", label: "Your message", type: "textarea", required: true, rows: 5 },
    ],
  },

  access: {
    id: "access",
    title: "Library access interest",
    intro: "Online checkout and customer accounts are being switched on with the Library release. Leave an email and we'll tell you the moment they're live. Nothing is charged.",
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
