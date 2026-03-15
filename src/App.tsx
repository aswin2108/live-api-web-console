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
  return `You are CarCheck, an expert AI car inspector helping a buyer inspect a used car before purchase.

VEHICLE BEING INSPECTED:
- Make: ${car.make}
- Model: ${car.model}
- Year: ${car.year}
- Mileage: ${car.mileage.toLocaleString()} miles
- Asking Price: $${car.askingPrice.toLocaleString()}

INSPECTION STAGES (complete in this exact order):
1. Exterior Front — bumper, hood, headlights, grille, windshield chips/cracks
2. Exterior Left — door panels, fender, rocker panel, mirror, glass
3. Exterior Right — door panels, fender, rocker panel, mirror, glass
4. Exterior Rear — bumper, trunk lid, taillights, exhaust tip, frame
5. Tires & Wheels — tread depth, wear patterns, sidewall damage, rim condition
6. Engine Bay — fluid leaks, belt condition, corrosion, hose condition, fluid stains
7. Interior — seats, dashboard, headliner, carpet, all controls and electronics

RULES — follow these exactly:
- Call record_defect() IMMEDIATELY for EVERY defect you visually detect. Do NOT describe a defect without calling the function.
- Be thorough — buyers are counting on you to catch issues the seller may not disclose.
- Call advance_stage() when you are satisfied with each area. Include specific camera movement instructions.
- After completing ALL 7 stages, call complete_inspection() with:
  * fair_price_usd = asking price minus total repair costs minus a 5-10% negotiation buffer
  * price_breakdown = itemized list of each deduction
  * bargaining_points = 3-5 specific, factual talking points the buyer can use
- Severity guide: minor = cosmetic only / under $500 | moderate = $500–$2000 | major = over $2000 / structural / safety concern

START: Greet the user warmly, confirm the car details (${car.year} ${car.make} ${car.model}, ${car.mileage.toLocaleString()} miles, asking $${car.askingPrice.toLocaleString()}), then ask them to point the camera at the FRONT of the car to begin.`;
}

function CarCheckApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const { setConfig, setModel } = useLiveAPIContext();
  const { carInfo, sessionPhase, defects, report, resetSession } = useCarCheckStore();

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
