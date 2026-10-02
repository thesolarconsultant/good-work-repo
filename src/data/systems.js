// The intelligent systems inside Goodwork Studio, one page each. Every claim
// here is about what the system is designed to do and what a buyer receives;
// none quotes a result Goodwork has not measured.

import { gbp } from "../lib/format";
import { MANAGED_PLANS } from "./offers";

/** Which monthly plan first runs a system for the client, with its price. */
const runFrom = (planId, what) => {
  const plan = MANAGED_PLANS.find((p) => p.id === planId);
  return `Run for you${what ? `, ${what},` : ""} from ${gbp(plan.price)} per month, on the ${plan.name} plan.`;
};

export const SYSTEMS = [
  {
    slug: "content-console",
    name: "Content Console",
    eyebrow: "Studio system · Content",
    tier: "studio",
    outcome: "Turn business knowledge into useful content without starting from an empty screen.",
    summary:
      "A dashboard that plans, drafts and publishes what a business puts out: blogs, social, email and WhatsApp templates, with the SEO fields on the same screen as the writing. The screenshots on this page are consoles Goodwork has built and run for clients.",
    receive: [
      "The Content Console source and setup guide",
      "Pipeline, review queue, editor, email, social and WhatsApp template modules",
      "The intake interview and quality-gate patterns",
      "A model-provider adapter (one file) and an .env template",
      "Deployment notes for static hosts and edge functions",
    ],
    needs: [
      "A model provider API key (billed to you)",
      "Somewhere to host the console (your own, or a managed plan)",
      "A repository or file store for the content it writes",
    ],
    managed: runFrom("console"),
    ctas: [
      { label: "Get Goodwork Studio — £888", to: "/studio#access" },
      { label: "Have Goodwork install it", to: "/built-by-goodwork", variant: "outline" },
    ],
    showConsoleSections: true,
  },
  {
    slug: "whatsapp-bot",
    name: "WhatsApp Bot",
    eyebrow: "Studio system · Enquiries",
    tier: "studio",
    outcome: "Create structured enquiry, qualification and support journeys.",
    summary:
      "A conversation system for the WhatsApp Business platform that asks the questions you would ask, at any hour, and hands a qualified enquiry to a person, a calendar or the CRM. The conversation below is an illustrative flow, not a captured transcript.",
    receive: [
      "The bot flow system and a library of qualification journeys",
      "Template message patterns written for Meta's approval process",
      "Booking, hand-off and follow-up branches",
      "Implementation guidance for the WhatsApp Business API and common providers",
      "A checklist for number setup, verification and testing",
    ],
    needs: [
      "A WhatsApp Business account and number",
      "A messaging provider (conversation charges billed to you)",
      "Hosting for the flow runtime, or a managed plan",
    ],
    managed: runFrom("complete", "with chatbot credit"),
    ctas: [
      { label: "Get Goodwork Studio — £888", to: "/studio#access" },
      { label: "Have Goodwork configure one flow", to: "/built-by-goodwork", variant: "outline" },
    ],
    showPhoneDemo: true,
  },
  {
    slug: "voice-agent",
    name: "Voice Agent",
    eyebrow: "Studio system · Calls",
    tier: "studio",
    outcome: "Build a capable first point of contact that can answer, qualify and book.",
    summary:
      "A voice agent that answers in the business's name, handles routine questions, takes the details and books the call or the job. Built as a defined journey with clear hand-off rules, not an open-ended chatbot on a phone line.",
    receive: [
      "The voice-agent journey system: greeting, qualification, booking and hand-off",
      "Prompt and guardrail templates for one business at a time",
      "Call-outcome logging patterns for the CRM",
      "Implementation guidance for common telephony and voice providers",
      "A launch checklist covering numbers, hours, fallbacks and consent wording",
    ],
    needs: [
      "A telephone number and telephony provider (numbers and minutes billed to you)",
      "A voice and model provider (usage billed to you)",
      "Hosting for the agent runtime, or a managed plan",
    ],
    managed: runFrom("complete", "with voice-agent credit"),
    ctas: [
      { label: "Get Goodwork Studio — £888", to: "/studio#access" },
      { label: "Have Goodwork configure one flow", to: "/built-by-goodwork", variant: "outline" },
    ],
    journey: [
      { who: "Caller", text: "Hi, I'm after a quote for a roof repair." },
      { who: "Agent", text: "I can help with that. Is the property a house or a flat, and roughly when did you notice the problem?" },
      { who: "Caller", text: "A house. Water's been coming in since the weekend." },
      { who: "Agent", text: "That's one we'll treat as urgent. I can book a survey tomorrow between 8 and 10, or Thursday between 1 and 3. Which suits?" },
      { who: "Caller", text: "Tomorrow morning." },
      { who: "Agent", text: "Booked. You'll get a text confirmation now, and the team has your address and the note about the leak." },
    ],
  },
  {
    slug: "brand-guide",
    name: "Brand Guide System",
    eyebrow: "Studio system · Brand",
    tier: "studio",
    outcome: "Define positioning, voice, visual direction and consistent application.",
    summary:
      "A discovery framework and a guideline generator. Answer the discovery questions, run the AI-assisted prompts, and produce a brand guideline that is a working token file as well as a document, so the website, the console and the templates all read from the same decisions.",
    receive: [
      "The brand discovery framework and interview scripts",
      "AI-assisted brand prompts for positioning, voice and visual direction",
      "The brand.css token contract every Goodwork template reads",
      "A guideline document template with logo, colour, type and application rules",
      "Logo artwork and social asset generation scripts",
    ],
    needs: ["Time with the business owner for discovery", "Optionally, a model provider for the assisted prompts"],
    ctas: [
      { label: "Get Goodwork Studio — £888", to: "/studio#access" },
      { label: "See how tokens drive a site", to: "/docs/brand-tokens", variant: "outline" },
    ],
  },
  {
    slug: "automations",
    name: "Automation Blueprints",
    eyebrow: "Studio system · Operations",
    tier: "studio",
    outcome: "Connect forms, follow-ups, internal actions and customer communication.",
    summary:
      "Workflow blueprints for the automations every small business ends up needing: form to CRM, enquiry to follow-up, booking to reminder, review request after the job. Written as diagrams and step lists that map onto any automation tool, plus the webhook payload shapes the Goodwork forms already send.",
    receive: [
      "Automation templates and workflow blueprints",
      "Lead-capture and qualification flows",
      "Webhook payload references for every Goodwork form",
      "System diagrams and implementation checklists",
      "Fair-use and cost-control notes for each integration",
    ],
    needs: ["An automation tool or your own endpoint", "The third-party accounts each workflow connects"],
    ctas: [
      { label: "Get Goodwork Studio — £888", to: "/studio#access" },
      { label: "Discuss the Embedded CRM", to: "/crm", variant: "outline" },
    ],
  },
];

export const SYSTEM = Object.fromEntries(SYSTEMS.map((s) => [s.slug, s]));
