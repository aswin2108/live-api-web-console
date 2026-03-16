# CarCheck — AI Car Inspector

## Inspiration

It started with a bad deal.

A close friend spent ₹4.2 lakhs on a used hatchback that looked fine at the lot. Two months later: a seized engine, rust eating through the floor pan, and a service history that turned out to be fabricated. The car had flood damage — something any trained eye would have caught in ten minutes. But we aren't trained eyes. We're just people trying to buy a car.

India's used car market moves ₹1.5 lakh crore a year, and it runs largely on information asymmetry. The seller knows the car's history. The buyer doesn't. Hiring a pre-purchase inspection mechanic costs ₹1,500–₹3,000, requires booking in advance, and isn't even available in most tier-2 cities. Most buyers skip it entirely — and sellers count on that.

I wanted to build something that puts the mechanic in the buyer's pocket. For free. Available anywhere. Right at the moment it's needed — standing in a parking lot, phone in hand, seller waiting.

---

## What I Built

CarCheck is a real-time AI car inspection assistant powered by the **Gemini Live API**. The buyer enters the car's details — make, model, year, mileage, asking price — and then simply points their phone camera at the vehicle.

From there, Gemini takes over. It sees what the camera sees, talks the buyer through a structured **7-stage inspection**:

1. Exterior Front
2. Exterior Left
3. Exterior Right
4. Exterior Rear
5. Tyres & Wheels
6. Engine Bay
7. Interior

At each stage, it asks the user to perform physical checks the camera can't do — pressing door panels for filler, smelling seals for flood damage, testing brake pedal feel. Every defect found is logged instantly. Every VIN and date code is cross-verified for fraud.

When all 7 stages are done, CarCheck generates a **fair price report**: the asking price minus itemized repair costs minus a negotiation buffer, with 3–5 hard bargaining points the buyer can use on the spot.

The fair offer price is calculated as:

$$P_{\text{fair}} = P_{\text{asking}} - \sum_{i=1}^{n} C_i - \delta$$

where $C_i$ is the estimated repair cost of each defect $i$, and $\delta$ is a 5–10% negotiation buffer applied to the adjusted value.

---

## How I Built It

The frontend is **React + TypeScript**, built on top of Google's `live-api-web-console` boilerplate. The core is the `GenAILiveClient` — a WebSocket wrapper around the Gemini Live API that streams bidirectional audio and video frames in real time.

**The system prompt is the brain.** A 1,000-word instruction set tells Gemini exactly how to conduct the inspection: which stages to follow, what fraud patterns to look for, how to interpret VIN plates and tyre DOT codes, when to ask for physical tests, and how to calculate repair costs in Indian Rupees at realistic local workshop rates.

**Tool calls drive the UI.** Three function declarations — `record_defect`, `advance_stage`, and `complete_inspection` — let Gemini update the React state directly as it works. The inspection panel updates live. The stage badge advances. The final report renders the moment Gemini calls `complete_inspection`.

Inspection reports are saved to **Firebase Firestore**, giving every completed inspection a permanent record.

The app is deployed as a static site on **Netlify**, with the Gemini API called directly from the browser — no backend server required.

---

## Challenges

**The hardest problem was session continuity.** The Gemini Live API is stateless — every new WebSocket connection starts completely fresh. The Live API has a natural timeout, and on mobile networks connections drop. Every time that happened, CarCheck would reconnect and Gemini would greet the user as if meeting them for the first time, mid-inspection.

The fix was to keep the Zustand store state — current stage, completed stages, all recorded defects — continuously synced back into the `LiveConnectConfig`. On every reconnect, the system prompt now includes a full resume context: which stages are done, which defects were found, and an explicit instruction not to restart. Gemini picks up with *"Welcome back! Continuing the Engine Bay inspection."*

**Prompting for structured behavior in a live voice session was non-trivial.** Getting a conversational audio model to reliably call `record_defect()` *before* describing a defect — every single time, not just most of the time — required many iterations. The instruction *"Call record_defect() IMMEDIATELY for EVERY defect found. Do NOT describe a defect without calling the function first."* had to be stated that explicitly.

**Camera framing on mobile is a real UX problem.** Gemini can only inspect what the camera shows it, and buyers naturally hold the phone awkwardly. Teaching the model to give precise camera direction instructions ("tilt the phone down to show the rocker panel", "move 30 cm closer to the VIN plate") made a significant difference in inspection quality.

---

## What I Learned

Building CarCheck taught me that the most important part of a multimodal live agent isn't the model — it's the **contract you establish with it**. A well-structured system prompt that defines stages, rules, tools, and failure modes turns a general-purpose model into a reliable domain expert.

I also learned that real-time voice + vision is a fundamentally different UX paradigm than chat. Latency is emotional. A half-second delay feels natural in conversation; a two-second delay feels broken. The Gemini Live API's native audio streaming made this feel like an actual phone call with a mechanic — which was exactly the experience I was aiming for.
