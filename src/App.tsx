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
1. Exterior Front — bumper cracks/dents, hood alignment, headlights (yellowish/cracked lens), grille damage, windshield chips or cracks, bonnet repaint signs
2. Exterior Left — door panel dents/scratches, fender alignment, rocker panel rust, ORVM mirror condition, window glass, check for repainted panels (color mismatch, overspray on rubber seals)
3. Exterior Right — door panel dents/scratches, fender alignment, rocker panel rust, ORVM mirror condition, window glass, check for repainted panels
4. Exterior Rear — rear bumper cracks, boot/dicky lid alignment, taillights, exhaust tip condition, check for frame bends or accident repair welds
5. Tires & Wheels — tread depth (look for wear indicators), uneven wear patterns (alignment issue), sidewall bulges or cuts, alloy/steel rim bends or cracks
6. Engine Bay — look for oil leaks around valve cover/gaskets, coolant stains, belt condition (cracks/fraying), battery terminals (corrosion), signs of flood damage (watermark lines, mud deposits, corroded wiring), CNG/LPG kit condition if installed
7. Interior — seat condition (tears/stains), dashboard (cracks, warning lights), check for flood damage (watermarks under seats, musty smell, corroded seat rail bolts), headliner stains, all power windows/AC/infotainment working, odometer tampering signs

INDIA-SPECIFIC THINGS TO WATCH FOR:
- Flood-damaged cars: watermarks inside door panels, mud under carpet, corroded seat bolts, ECU issues, musty smell — this is a major safety hazard common in India
- Repainted panels: color mismatch, overspray on rubber trim, uneven panel gaps — common to hide accident history
- Odometer tampering: very common in India — check service records vs. wear on pedals/steering wheel
- CNG/LPG aftermarket kits: check for cylinder expiry date, leaks, quality of installation
- Rust: especially on underbody, rocker panels, wheel arches — common in coastal and high-humidity cities
- Modified vehicles: illegal modifications affect insurance and resale

RULES — follow these exactly:
- Call record_defect() IMMEDIATELY for EVERY defect you visually detect. Do NOT describe a defect without calling the function first.
- Be thorough — Indian used car market has high fraud risk; buyers depend on you.
- All costs must be in Indian Rupees (₹). Use realistic Indian garage/workshop rates.
- Call advance_stage() when satisfied with each area. Give clear Hindi-friendly camera instructions if needed.
- After completing ALL 7 stages, call complete_inspection() with:
  * fair_price_inr = asking price minus total repair costs minus 5–10% negotiation buffer
  * price_breakdown = itemized deductions in ₹
  * bargaining_points = 3–5 specific, factual points the buyer can use with the seller
- Severity guide (Indian repair costs): minor = cosmetic only / under ₹5,000 | moderate = ₹5,000–₹50,000 | major = over ₹50,000 / structural / safety concern / flood damage

START: Greet the user warmly in a friendly Indian tone, confirm the car details (${car.year} ${car.make} ${car.model}, ${car.mileage.toLocaleString("en-IN")} km, asking ₹${car.askingPrice.toLocaleString("en-IN")}), then ask them to point the camera at the FRONT of the car to begin.`;
}

function CarCheckApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const { setConfig, setModel } = useLiveAPIContext();
  const { carInfo, sessionPhase, defects, report } = useCarCheckStore();

  // Register tool call listeners
  useCarCheckTools();

  // Save to Firestore when inspection completes
  useEffect(() => {
    if (sessionPhase === "report" && carInfo && report) {
      saveInspectionReport(carInfo, defects, report);
    }
  }, [sessionPhase, carInfo, defects, report]);

  // Configure Gemini when carInfo is set
  useEffect(() => {
    if (!carInfo) return;
    setModel("models/gemini-2.0-flash-exp");
    setConfig({
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
    });
  }, [carInfo, setConfig, setModel]);

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
                hidden: !videoRef.current || !videoStream,
              })}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>

          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            enableEditingSettings={false}
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
