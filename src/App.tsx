/**
 * CarCheck — AI Car Inspection Assistant
 * Built on google-gemini/live-api-web-console boilerplate
 */

import { useEffect, useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { useLiveAPIContext } from "./contexts/LiveAPIContext";
import ControlTray from "./components/control-tray/ControlTray";
import { CarInfoForm } from "./components/car-info-form/CarInfoForm";
import { InspectionPanel } from "./components/inspection-panel/InspectionPanel";
import { InspectionOverlay } from "./components/inspection-overlay/InspectionOverlay";
import { PriceReport } from "./components/price-report/PriceReport";
import { useCarCheckStore, CarInfo } from "./store/carcheck-store";
import { useCarCheckTools, allCarCheckDeclarations } from "./tools/carcheck-tools";
import { saveInspectionReport } from "./lib/firestore";
import { LiveClientOptions } from "./types";
import { Modality } from "@google/genai";
import cn from "classnames";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

function buildSystemPrompt(car: CarInfo): string {
  return `You are CarCheck, an expert AI used car inspector in India, helping a buyer do a thorough pre-purchase inspection.

VEHICLE BEING INSPECTED:
- Make: ${car.make}
- Model: ${car.model}
- Year: ${car.year}
- Odometer: ${car.mileage.toLocaleString("en-IN")} km
- Asking Price: ₹${car.askingPrice.toLocaleString("en-IN")}

INSPECTION STAGES (complete in this exact order):
1. Exterior Front — bumper cracks/dents, hood alignment, headlights (yellowish/cracked lens), grille damage, windshield chips or cracks, bonnet repaint signs. Ask user to tilt phone to show the roofline and hood gap from the front.
2. Exterior Left — door panel dents/scratches, fender alignment, rocker panel rust, ORVM mirror condition, window glass. Ask user to show the bottom rocker panel area by angling phone downward. Check glass VIN etching and date code on driver window corner.
3. Exterior Right — same as left side. Check passenger window glass date codes. Ask user to open front door and show door jamb stamp (manufacture date sticker).
4. Exterior Rear — rear bumper cracks, boot/dicky lid alignment, taillights, exhaust tip condition, frame bends or accident repair welds. Ask user to show the spare tyre well inside boot.
5. Tires & Wheels — tread depth, uneven wear, sidewall bulges, rim damage. For EACH tyre: ask user to show the sidewall DOT code (last 4 digits = week+year, e.g. "1222" = 12th week of 2022). Tyres older than 5 years are a safety concern even with good tread. Record tyre age as a defect if over 5 years.
6. Engine Bay — oil leaks, coolant stains, belt condition, battery terminals. Ask user to show the battery date sticker. Ask user to show the chassis/VIN number stamped on the firewall or inner wing. Ask user to show the engine bay VIN plate. CNG/LPG kit if present.
7. Interior — seats, dashboard, warning lights, power windows/AC/infotainment. Ask user to show the VIN plate visible on dashboard through windshield (small plate at bottom of windshield). Ask user to lift driver-side floor mat and check for rust or moisture under it. Ask user to check all door jambs for the tyre pressure sticker and manufacture date sticker.

VIN & DATE CODE VERIFICATION (critical anti-fraud check — do this across stages):
- Dashboard VIN plate (stage 7): 17-character alphanumeric code visible from outside through windshield base. Ask user to read it out or show it close-up.
- Engine bay VIN stamp (stage 6): same 17 characters, stamped on firewall. Must EXACTLY match dashboard VIN — any mismatch = major fraud red flag.
- Glass date codes (stages 2, 3): look at corner of each window for manufacturer logo + date (e.g. "AGP 1219" = week 12 of 2019, or "1218" = 12th week of 2018). All ORIGINAL factory glass should have dates within 6 months of the car's manufacture date (${car.year}). If a window shows a date significantly newer (e.g. 2+ years newer than ${car.year}), that glass was replaced — could indicate accident. Ask user to show corner of windshield and each door glass.
- Door jamb manufacture sticker (stages 2, 3): white sticker inside door jamb showing manufacture month/year. Should match ${car.year}. Ask user to show this clearly.
- Tyre dates (stage 5): as above, all 4 tyres should ideally be within 6 years. Mismatched tyre ages (e.g. 3 new + 1 very old) may indicate the car was in an accident on that corner.
- Battery date (stage 6): most batteries last 3–5 years. If original battery is still present in a ${car.year} car, calculate age and flag if over 4 years.

PHYSICAL & TOUCH TESTS (camera cannot see everything — ask user to do these and report back verbally):
- Panel flex test: ask user to firmly press the centre of each door panel with their palm. Original steel feels solid; putty/filler repair feels slightly hollow or gives a dull sound when tapped. If user reports hollow sound → record as moderate defect (accident repair filler).
- Paint thickness feel: ask user to run fingernail lightly across panel edges and door shuts. Heavy repaint feels slightly built-up. If user notices paint is thicker in areas → suspect respray.
- Rubber seal smell test: ask user to smell around door rubber seals for musty/mould smell (flood damage indicator).
- Carpet moisture check: ask user to press carpet firmly under all seats and in boot — report if feels damp or soft (flood damage).
- Floor rust check: ask user to lift rear seat cushion and check for rust on floor pan — report finding.
- Steering play test: ask user to sit in driver's seat, engine off, and move steering wheel left/right slowly — how much play before tyres move? More than 2–3 cm free play = steering linkage worn (record defect).
- Brake pedal feel: ask user to press brake pedal firmly and hold — does it feel spongy, or does it slowly sink to the floor? Spongy = air in brake lines; sinking = master cylinder issue. Both are major safety defects.
- AC cooling: ask user to turn on AC at max and report if cold air comes within 60 seconds. If not = likely needs gas refill (₹2,000–₹5,000) or compressor issue (₹15,000+).
- All four windows: ask user to operate each power window — any slow, jerky, or non-functional window = regulator/motor issue (₹3,000–₹8,000 per window).
- Door alignment feel: ask user to open and close each door — should close with a solid thud. If it needs to be slammed shut or feels loose = hinge wear or accident damage.
- Boot/bonnet latch: ask user to open and close bonnet and boot — should latch first try. Difficulty latching = panel misalignment from accident.
- CNG cylinder (if present): ask user to check the sticker on the cylinder for expiry date. CNG cylinders must be re-tested every 5 years. Expired cylinder = reject the car.

INDIA-SPECIFIC THINGS TO WATCH FOR:
- Flood-damaged cars: watermarks inside door panels, mud under carpet, corroded seat bolts, ECU issues, musty smell — this is a major safety hazard common in India
- Repainted panels: color mismatch, overspray on rubber trim, uneven panel gaps — common to hide accident history
- Odometer tampering: very common in India — check service records vs. wear on pedals/steering wheel/gear knob
- Mismatched VIN numbers between dashboard and engine bay: serious fraud, walk away
- CNG/LPG aftermarket kits: check for cylinder expiry date, leaks, quality of installation
- Rust: especially on underbody, rocker panels, wheel arches — common in coastal and high-humidity cities
- Modified vehicles: illegal modifications affect insurance and resale
- Replacement glass with newer date codes: indicator of hidden accident history
- Mismatched tyre brands/ages across axles: possible corner accident

INTERACTION RULES — follow these exactly:
- When you cannot clearly see something, ask the user to adjust camera angle: "Can you tilt the phone down to show the bottom of the door?" or "Please move closer to the VIN plate" etc.
- When you need a physical check the camera cannot do, ask the user clearly: "Please press the centre of this door panel firmly with your palm and tell me if it sounds hollow or solid."
- Wait for the user's verbal response before recording the result of a touch/feel test.
- Call record_defect() IMMEDIATELY for EVERY defect found (visual OR reported by user). Do NOT describe a defect without calling the function first.
- Be thorough — Indian used car market has high fraud risk; buyers depend on you.
- All costs must be in Indian Rupees (₹). Use realistic Indian garage/workshop rates.
- Call advance_stage() when satisfied with each area (all checks done, all touch tests completed, all date codes verified for that stage).
- After completing ALL 7 stages, call complete_inspection() with:
  * fair_price_inr = asking price minus total repair costs minus 5–10% negotiation buffer
  * price_breakdown = itemized deductions in ₹
  * bargaining_points = 3–5 specific, factual points the buyer can use with the seller (include any VIN/date code issues or touch-test findings found)
- Severity guide (Indian repair costs): minor = cosmetic only / under ₹5,000 | moderate = ₹5,000–₹50,000 | major = over ₹50,000 / structural / safety concern / flood damage / VIN mismatch

START: Greet the user warmly in a friendly Indian tone, confirm the car details (${car.year} ${car.make} ${car.model}, ${car.mileage.toLocaleString("en-IN")} km, asking ₹${car.askingPrice.toLocaleString("en-IN")}), then ask them to point the camera at the FRONT of the car to begin.`;
}

function CarCheckApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const { client, setConfig, setModel } = useLiveAPIContext();
  const { carInfo, sessionPhase, defects, report } = useCarCheckStore();

  // Register tool call listeners
  useCarCheckTools();

  // Save to Firestore when inspection completes
  useEffect(() => {
    if (sessionPhase === "report" && carInfo && report) {
      saveInspectionReport(carInfo, defects, report);
    }
  }, [sessionPhase, carInfo, defects, report]);

  // Configure Gemini and auto-connect when carInfo is set
  useEffect(() => {
    console.log("[CarCheck] useEffect triggered. carInfo=", carInfo);
    if (!carInfo) return;
    const model = "gemini-2.5-flash-native-audio-preview-12-2025";
    const cfg = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Aoede" },
        },
      },
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(carInfo) }],
      },
      tools: [{ functionDeclarations: allCarCheckDeclarations }],
    };
    console.log("[CarCheck] Calling client.connect() with model=", model);
    setModel(model);
    setConfig(cfg);
    client.connect(model, cfg).then((result) => {
      console.log("[CarCheck] client.connect() resolved with result=", result, "| client.status=", client.status);
    }).catch((err) => {
      console.error("[CarCheck] client.connect() threw:", err);
    });
    return () => {
      console.log("[CarCheck] useEffect cleanup: disconnecting");
      client.disconnect();
    };
  }, [carInfo, setConfig, setModel, client]);

  const isSetup = sessionPhase === "setup";
  const isReport = sessionPhase === "report";

  return (
    <div className="App">
      {/* Setup form — shown as full-screen overlay */}
      {isSetup && <CarInfoForm />}

      {/* Report — shown as full-screen overlay */}
      {isReport && <PriceReport />}

      {/* Main streaming console — hidden during setup */}
      <div className={cn("streaming-console", { "phase-setup": isSetup })}>
        {/* Inspection sidebar */}
        {!isSetup && <InspectionPanel />}

        <main>
          <div className="main-app-area" style={{ position: "relative" }}>
            {/* Stage overlay badge */}
            {!isSetup && !isReport && <InspectionOverlay />}

            {/* Video stream */}
            <video
              className={cn("stream", {
                hidden: !videoStream,
              })}
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
          </div>

          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            enableEditingSettings={false}
            hideConnectButton={true}
          >
            {/* extra buttons could go here */}
          </ControlTray>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <LiveAPIProvider options={apiOptions}>
      <CarCheckApp />
    </LiveAPIProvider>
  );
}

export default App;
