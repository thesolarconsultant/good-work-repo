// Legal pages. Every page below is a DRAFT written to the commercial
// principles in data/offers.js and is marked for solicitor review on the
// page itself. Nothing here should be read as final binding wording until
// the `review` flag is cleared by the business.

import { LICENCE_PRINCIPLES, UPDATE_PERIOD_MONTHS } from "./offers";

const REVIEW_NOTE =
  "Draft for solicitor review. This page states Goodwork's intended position in plain language. Binding wording will be published once legal review is complete.";

export const LEGAL = [
  {
    slug: "licence",
    title: "Commercial licence",
    summary: "What a Goodwork Library or Studio licence lets you do, and what it does not.",
    updated: "2026-09-26",
    review: true,
    reviewNote: REVIEW_NOTE,
    sections: [
      {
        h: "The principles",
        ol: LICENCE_PRINCIPLES,
      },
      {
        h: "Which products carry which rights",
        p: [
          "Goodwork Library and Goodwork Studio grant a single-customer licence to build completed websites and systems for your own business or for your clients. Built by Goodwork delivers one implementation for one business under the same principles. The Agency programme adds commercial white-label implementation rights for finished client work.",
          "No product grants the right to redistribute, publish, share, sublicense or sell Goodwork's raw source files, or to use them to create a competing template library, UI kit, source-code marketplace or downloadable product.",
        ],
      },
      {
        h: "Updates and continued use",
        p: [
          `Library and Studio include ${UPDATE_PERIOD_MONTHS} months of updates and new releases. After the included period you keep permanent rights to continue using code already downloaded under the licence.`,
        ],
      },
      {
        h: "Third-party code",
        p: ["Third-party packages, fonts and services used alongside Goodwork code remain governed by their own licences, which you are responsible for complying with."],
      },
      {
        h: "Suspension",
        p: ["Access may be suspended for fraud, credential sharing, redistribution or material breach of the licence."],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    summary: "The terms on which Goodwork sells products and delivers services.",
    updated: "2026-09-26",
    review: true,
    reviewNote: REVIEW_NOTE,
    sections: [
      {
        h: "Products",
        p: [
          "Goodwork Library and Goodwork Studio are digital products supplied under the commercial licence. Prices are stated as one-time payments in pounds sterling. Access is personal to the purchasing customer.",
        ],
      },
      {
        h: "Services",
        p: [
          "Built by Goodwork, the Embedded CRM implementation and the Agency programme are services. Each is scoped in writing before work begins. The scope, the page limits, the agreed integrations, the agent journeys and the revision allowance are stated in the proposal or agreement, and work outside them is quoted separately.",
          "Customers agree to supply or approve required business information promptly. Timelines depend on it.",
        ],
      },
      {
        h: "Third-party and operational costs",
        p: [
          "Hosting, domains, servers, messaging, telephony, AI-model and API usage, email, SMS and third-party subscriptions are not included in any one-time fee. They are paid to the relevant provider, or covered by a managed plan subject to its fair-use allowance.",
        ],
      },
      {
        h: "Managed plans",
        p: [
          "Managed plans are monthly, optional and separate from ownership of the build. Allowances are confirmed before launch. Usage beyond an allowance, additional agents, additional telephone numbers, complex integrations and bespoke maintenance are quoted separately.",
        ],
      },
      {
        h: "Payment",
        p: [
          "Products are paid in full at checkout. Services are invoiced according to the agreed proposal. The Agency programme may be paid in full or in four agreed payments subject to agreement and contract.",
        ],
      },
      {
        h: "Liability and governing law",
        p: ["To be confirmed in the reviewed wording. Goodwork is a UK business and these terms are intended to be governed by the law of England and Wales."],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refund policy",
    summary: "Refunds on digital products and services.",
    updated: "2026-09-26",
    review: true,
    reviewNote:
      "Draft for solicitor review. Refund wording for downloadable digital content must comply with the Consumer Contracts Regulations and the Consumer Rights Act, including the rules on waiving the cancellation period once a download begins. The wording below is Goodwork's intended position, not yet reviewed.",
    sections: [
      {
        h: "Digital products (Library and Studio)",
        p: [
          "Because Library and Studio deliver digital source files immediately, refund rights are limited once download or access has begun. Before checkout you will be asked to acknowledge that access starts immediately and that you lose the statutory right to cancel once it does.",
          "If a product is faulty, not as described, or you have been unable to access what you paid for, contact us and we will put it right or refund you.",
        ],
      },
      {
        h: "Services",
        p: [
          "Services are scoped and agreed in writing before work starts. Deposits, milestones and any refundable portion are stated in the proposal or agreement.",
        ],
      },
      {
        h: "Managed plans",
        p: ["Managed plans can be cancelled at the end of the current billing month. No refund is made for a part month."],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What Goodwork collects, why, and how long it is kept.",
    updated: "2026-09-26",
    review: true,
    reviewNote: REVIEW_NOTE,
    sections: [
      {
        h: "What we collect",
        p: [
          "Enquiry and application forms collect the details you type into them: name, business, contact details and the answers to the questions on the form. Purchases collect the details needed to take payment and deliver access. Analytics events are recorded without a third-party provider by default; if one is enabled it will be named here.",
        ],
      },
      {
        h: "Why",
        p: [
          "To reply to you, to scope and deliver the work you asked about, to deliver purchased products, to keep customer accounts secure, and to meet legal obligations such as accounting records.",
        ],
      },
      {
        h: "Where it goes",
        p: [
          "Form submissions are delivered to Goodwork's inbox and, where configured, to Goodwork's own CRM. Payments are processed by the payment provider named at checkout. We do not sell personal data.",
        ],
      },
      {
        h: "Retention and your rights",
        p: [
          "Enquiries are kept for as long as needed to respond and for a reasonable period afterwards. Customer and purchase records are kept for the periods required by law. You can ask what we hold, ask for corrections, or ask for deletion where the law allows, by emailing hello@goodwork.agency.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie information",
    summary: "What this site stores in your browser.",
    updated: "2026-09-26",
    review: false,
    sections: [
      {
        h: "Strictly necessary storage",
        p: [
          "The site uses session storage to keep a half-completed form if you refresh the page, and local storage to remember whether you dismissed the announcement bar. Neither identifies you and neither is sent to a server.",
        ],
      },
      {
        h: "Analytics",
        p: [
          "No third-party analytics or advertising cookies are set by default. Intent events such as viewing pricing or starting a checkout are emitted to the page for an approved analytics provider to pick up. If a provider is enabled, its cookies and a consent control will be described here before it goes live.",
        ],
      },
      {
        h: "Payments",
        p: ["If you proceed to checkout, the payment provider named on that page sets the cookies it needs to process the payment securely."],
      },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable use",
    summary: "How Goodwork products, accounts and hosted systems may be used.",
    updated: "2026-09-26",
    review: true,
    reviewNote: REVIEW_NOTE,
    sections: [
      {
        h: "Accounts and access",
        p: [
          "One customer account per licence. Credentials must not be shared. Download links are personal and time-limited, and download activity is logged for security and support.",
        ],
      },
      {
        h: "Source code",
        p: [
          "Use Goodwork code for permitted finished projects. Do not publish it to public repositories, marketplaces or template sites, and do not remove licence notices from files that carry them.",
        ],
      },
      {
        h: "Hosted and managed systems",
        p: [
          "WhatsApp bots, voice agents and consoles running on Goodwork-managed infrastructure must not be used for unsolicited bulk messaging, unlawful content, or anything that breaches the messaging or telephony provider's own policies. Fair-use allowances apply and are confirmed before launch.",
        ],
      },
      {
        h: "Consequences",
        p: ["Access may be suspended for fraud, credential sharing, redistribution or material breach of these rules or the licence."],
      },
    ],
  },
];

export const LEGAL_BY_SLUG = Object.fromEntries(LEGAL.map((l) => [l.slug, l]));
