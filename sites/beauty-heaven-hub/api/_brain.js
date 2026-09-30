// The Beauty Heaven receptionist: one brain for every channel.
//
// Telegram now, WhatsApp next, and the phone agent's tools later all call
// reply(). It answers from the salon's own data (/book/services.json, built
// from Phorest), checks live free times, books through the same makeBooking()
// as the website, and hands anything clinical, unclear or upset to a person.
//
// Model: Claude Opus 5.5 via the Anthropic API (a business account, never a
// Claude subscription). BOT_MODEL overrides it. Effort is kept low: this is
// short-turn chat. Refusals fall back server-side ("fallbacks": "default").

import Anthropic from "@anthropic-ai/sdk";
import { loadMenu, findService, freeTimes, makeBooking, bookingLive, london } from "./_booking.js";
import { loadConversation, appendMessages } from "./_store.js";

const MODEL = process.env.BOT_MODEL || "claude-opus-5-5";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY
const MAX_STEPS = 8;

// ---------------------------------------------------------------- tools --
const TOOLS = [
  {
    name: "find_treatments",
    description: "Search the salon's treatment menu. Returns matching treatments with their id, section, length, price (null means the price is only given at a consultation), whether a client can book it themselves (bookable), and who does it. Use this before talking about any treatment, price or practitioner.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "What the client asked for, e.g. 'brow lamination', 'gel nails', 'lashes infill'." } },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "free_times",
    description: "Live free times from the salon diary for one treatment, for 7 days from a date. Only offer times this returns. Each time comes with the practitioner and a 'start' value to pass to book.",
    input_schema: {
      type: "object",
      properties: {
        treatment_id: { type: "string" },
        person_id: { type: ["string", "null"], description: "A practitioner's id, or null for anyone." },
        from_date: { type: "string", description: "YYYY-MM-DD, today or later." },
      },
      required: ["treatment_id", "person_id", "from_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "book",
    description: "Book a treatment into the salon diary. Only after the client has clearly said yes to the treatment, practitioner, day and time, and has given their first name, last name and UK mobile. A booking is final.",
    input_schema: {
      type: "object",
      properties: {
        treatment_id: { type: "string" },
        person_id: { type: "string" },
        start: { type: "string", description: "The exact 'start' value from free_times." },
        first_name: { type: "string" },
        last_name: { type: "string" },
        mobile: { type: "string" },
        email: { type: ["string", "null"] },
      },
      required: ["treatment_id", "person_id", "start", "first_name", "last_name", "mobile", "email"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "hand_over",
    description: "Pass the conversation to the salon team. Use for consultations, anything medical or about suitability, prescription-only treatments, Academy courses, complaints, changes or cancellations to existing bookings, anything you can't answer from the tools, or when the client asks for a person.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why, in a few words." },
        summary: { type: "string", description: "What the client wants, and their name and number if given, so the team can pick it up without asking again." },
      },
      required: ["reason", "summary"],
      additionalProperties: false,
    },
    strict: true,
  },
];

// ---------------------------------------------------------- the prompt --
function systemPrompt(data, channel) {
  const s = data.site || {};
  const sections = data.groups
    .map((g) => `- ${g.name}: ${g.cats.map((c) => c.title + (c.consult ? " (consultation first)" : "")).join(", ")}`)
    .join("\n");
  const hours = s.hours?.length ? s.hours.join("; ") : "not confirmed yet: say you'll check with the team";
  return `You are the virtual receptionist for ${s.name || "Beauty Heaven Hub"}, a beauty, aesthetics and hair salon with a training Academy, in Hoddesdon, Hertfordshire. You are talking to clients on ${channel}.

Who you are
- You are an AI assistant, and you say so in your first reply in every conversation. You are not a clinician.
- Warm, friendly and to the point, in British English. Short messages suited to a chat app: a few lines, no headings, no tables, sparing emoji. One question at a time.

The salon
- Address: ${(s.address || []).join(", ")}${s.addressConfirmed ? "" : " (as listed in the booking system)"}.
- Phone: ${s.phone || "see website"}. WhatsApp: ${s.whatsapp || "n/a"}. Website: ${s.website || ""}.${s.email ? ` Email: ${s.email}.` : ""}
- Opening hours: ${hours}.
- Treatment sections:
${sections}

How you work
- Only state treatments, prices, lengths, practitioners and times that your tools return. Never guess or make anything up. If you don't know, say you'll check with the team and use hand_over.
- Booking: find the treatment, offer the practitioners (or anyone), use free_times and offer a few times, not a long list. Then get first name, last name and mobile, read the booking back in one short message (treatment, who, day, date, time, price), and only call book once the client clearly says yes. After booking, confirm it plainly. Mention a patch test where the section needs one.
- If a treatment's "bookable" is false, don't book it: explain the team books it with them and use hand_over.
- If book returns "off", tell them online booking by chat is being switched on, and use hand_over so the team books it.
- If book returns "taken", apologise and offer the nearest other times.
- Consultations, suitability, anything medical, pregnancy, allergies, skin conditions, medication, aftercare problems: never advise. Say a practitioner will help, and use hand_over.
- Prescription-only treatments (anti-wrinkle injections, B12 and vitamin injections, weight-loss injections and similar): never give prices, offers or recommendations, and don't promote them. Say they start with a consultation with a practitioner, and use hand_over.
- Never promise results. Never criticise other salons.
- Academy courses, complaints, changing or cancelling an existing booking, refunds: use hand_over.
- Ask only for what a booking needs: name, mobile, and email if they want to give it. Never ask for health details, card details or passwords.
- Anything unrelated to the salon: politely say you can only help with Beauty Heaven.
- When you hand over, tell the client the team will get back to them, and give the phone number for anything urgent.`;
}

// ------------------------------------------------------ tool behaviour --
function norm(t) {
  return String(t || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function findTreatments(data, query) {
  const words = norm(query).split(" ").filter((w) => w.length > 1);
  const hits = [];
  for (const g of data.groups) for (const c of g.cats) for (const it of c.items) {
    const hay = norm(`${it.name} ${c.title} ${g.name}`);
    const name = norm(it.name);
    let score = 0;
    for (const w of words) {
      const stem = w.replace(/s$/, "");
      if (name.includes(stem)) score += 3;
      else if (hay.includes(stem)) score += 1;
    }
    if (score) hits.push({ score, g, c, it });
  }
  hits.sort((a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name));
  return hits.slice(0, 12).map(({ g, c, it }) => ({
    id: it.id,
    name: it.name,
    section: `${g.name} > ${c.title}`,
    minutes: it.mins,
    price: it.price,
    bookable: !!it.confirm,
    consultation_first: !!c.consult,
    patch_test: !!c.patch,
    people: it.staff.map(([id, price]) => ({ id, name: data.staff[id] || "", price })),
  }));
}

async function listTimes(data, input) {
  const found = findService(data, input.treatment_id);
  if (!found) return { error: "Unknown treatment id. Use find_treatments first." };
  const { item } = found;
  if (!item.staff.length) return { error: "Nobody takes this treatment online. Use hand_over." };
  const person = input.person_id || "";
  if (person && !item.staff.some(([id]) => id === person)) return { error: "That person doesn't do this treatment." };
  const today = london(Date.now()).date;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(input.from_date) && input.from_date >= today ? input.from_date : today;
  const start = new Date(`${from}T00:00:00Z`);
  const slots = await freeTimes(data, item, person, start.toISOString(), new Date(start.getTime() + 7 * 864e5).toISOString());
  // Keep it readable: quarter-hour starts, at most 12 a day.
  const days = new Map();
  for (const s of slots) {
    const t = new Date(s.start).getTime();
    if (t < Date.now()) continue;
    const l = london(t);
    if (!/:(00|15|30|45)$/.test(l.time)) continue;
    const key = l.date;
    if (!days.has(key)) days.set(key, []);
    const list = days.get(key);
    if (list.length < 12 && !list.some((x) => x.time === l.time && x.person_id === s.staff)) {
      list.push({ time: l.time, person: data.staff[s.staff] || "", person_id: s.staff, start: s.start });
    }
  }
  return {
    from,
    days: [...days].map(([date, times]) => ({ date, weekday: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }), times })),
    note: days.size ? "" : "No free times in these 7 days. Try the next week.",
  };
}

async function runTool(name, input, ctx) {
  const { data } = ctx;
  if (name === "find_treatments") return { results: findTreatments(data, input.query) };
  if (name === "free_times") return listTimes(data, input);
  if (name === "book") {
    const r = await makeBooking(
      data,
      { serviceId: input.treatment_id, staffId: input.person_id, start: input.start, firstName: input.first_name, lastName: input.last_name, mobile: input.mobile, email: input.email || "" },
      `the ${ctx.channel} assistant`,
    );
    return { status: r.status, ...(r.url ? { deposit_link: r.url } : {}), ...(r.error ? { message: r.error } : {}) };
  }
  if (name === "hand_over") {
    await ctx.handOver?.(input).catch((e) => console.error("hand_over:", e.message));
    return { status: "passed to the team" };
  }
  return { error: `Unknown tool ${name}` };
}

// -------------------------------------------------------------- the loop --
// -> the text to send back to the client.
export async function reply({ channel, chat, text, origin, handOver }) {
  const data = await loadMenu(origin);
  if (!data.live) return "Sorry, I can't reach the diary right now. Please call us or try again shortly.";
  const { convo, messages } = await loadConversation(channel, chat);
  const added = [];
  const push = (m) => { messages.push(m); added.push(m); };

  const now = london(Date.now());
  push({ role: "user", content: String(text).slice(0, 2000) });
  // The time, as an operator note after the client's message, so the cached prompt never changes.
  push({ role: "system", content: `Now: ${new Date(`${now.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, ${now.time} (UK time), ${now.date}. Online booking by chat is ${bookingLive(data) ? "on" : "not switched on yet"}.` });

  const ctx = { data, channel, handOver: handOver ? (input) => handOver({ ...input, channel, chat }) : null };
  let answer = "";
  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        cache_control: { type: "ephemeral" },
        system: systemPrompt(data, channel),
        tools: TOOLS,
        messages,
      });
      push({ role: "assistant", content: res.content });
      const said = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (said) answer = said;

      if (res.stop_reason === "refusal") {
        answer = "Sorry, I can't help with that here. I'll pass you to the team.";
        await ctx.handOver?.({ reason: "assistant declined", summary: String(text).slice(0, 300) }).catch(() => {});
        break;
      }
      if (res.stop_reason === "pause_turn") continue;
      if (res.stop_reason !== "tool_use") break;

      const results = [];
      for (const b of res.content.filter((x) => x.type === "tool_use")) {
        let out, isError = false;
        try {
          out = await runTool(b.name, b.input, ctx);
          isError = !!out?.error;
        } catch (e) {
          console.error(`tool ${b.name}:`, e.message);
          out = { error: "That didn't work just now. Try again, or hand over." };
          isError = true;
        }
        results.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(out), ...(isError ? { is_error: true } : {}) });
      }
      push({ role: "user", content: results });
    }
  } catch (e) {
    console.error("brain:", e.status || "", e.message);
    answer = "Sorry, something went wrong on my side. Please try again, or call us.";
    // Close the turn so the stored history stays valid for the next message.
    push({ role: "assistant", content: [{ type: "text", text: answer }] });
  } finally {
    await appendMessages(channel, chat, convo, added).catch((e) => console.error("store:", e.message));
  }
  return answer || "Sorry, I didn't catch that. Could you say it another way?";
}
