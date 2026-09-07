// Scripted walkthroughs for the "see it work" phone demos on the case
// studies that run a live AI booking agent. These are placeholder
// conversations — illustrative of the real flow, not a captured
// transcript — swap the `messages` array out for the real thing as soon
// as it's supplied. Keep every message short enough to read as a phone
// bubble, and keep the claims inside them true to what the agent actually
// does (nothing it can't really do).

export const TSC_AGENT_SCRIPT = {
  contact: "The Solar Consultant",
  subtitle: "AI booking agent",
  messages: [
    { from: "lead", text: "Hi, saw your site — thinking about solar but not sure where to start" },
    { from: "agent", text: "Good place to start. Quick one — is this for your own home, and roughly what's your electricity usage like day vs evening?" },
    { from: "lead", text: "Own home, 3 bed. We're out most of the day, home from 6ish" },
    { from: "agent", text: "Got it — that changes the sizing a fair bit from a south-facing empty-house setup. I'll book you a free 15-minute call with an advisor to go through it properly." },
    { from: "agent", text: "Tomorrow 2pm or Thursday 10am — which suits?" },
    { from: "lead", text: "Tomorrow 2pm works" },
    { from: "agent", text: "Booked ✅ Calendar invite's on its way, along with two quick questions to have answers to before the call." },
  ],
};
