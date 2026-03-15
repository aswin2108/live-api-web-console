import { create } from "zustand";

export type DefectSeverity = "minor" | "moderate" | "major";

export interface Defect {
  id: string;
  area: string;
  description: string;
  severity: DefectSeverity;
  repairCostEstimate: number;
}

export interface CarInfo {
  make: string;
  model: string;
  year: number;
  mileage: number;
  askingPrice: number;
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
}

export interface Report {
  fairPrice: number;
  breakdown: PriceBreakdownItem[];
  bargainingPoints: string[];
}

export type SessionPhase = "setup" | "inspecting" | "report";

export const INSPECTION_STAGES = [
  "Exterior Front",
  "Exterior Left",
  "Exterior Right",
  "Exterior Rear",
  "Tires & Wheels",
  "Engine Bay",
  "Interior",
];

interface CarCheckState {
  carInfo: CarInfo | null;
  sessionPhase: SessionPhase;
  currentStage: string;
  completedStages: string[];
  defects: Defect[];
  report: Report | null;

  // Actions
  setCarInfo: (info: CarInfo) => void;
  setSessionPhase: (phase: SessionPhase) => void;
  recordDefect: (defect: Omit<Defect, "id">) => void;
  advanceStage: (nextStage: string) => void;
  completeInspection: (report: Report) => void;
  resetSession: () => void;
}

const initialState = {
  carInfo: null,
  sessionPhase: "setup" as SessionPhase,
  currentStage: INSPECTION_STAGES[0],
  completedStages: [] as string[],
  defects: [] as Defect[],
  report: null,
};

export const useCarCheckStore = create<CarCheckState>()((set) => ({
  ...initialState,

  setCarInfo: (info) => set({ carInfo: info }),

  setSessionPhase: (phase) => set({ sessionPhase: phase }),

  recordDefect: (defect) =>
    set((state) => ({
      defects: [
        ...state.defects,
        { ...defect, id: `defect-${Date.now()}-${Math.random()}` },
      ],
    })),

  advanceStage: (nextStage) =>
    set((state) => ({
      completedStages: state.currentStage
        ? [...state.completedStages, state.currentStage]
        : state.completedStages,
      currentStage: nextStage,
    })),

  completeInspection: (report) =>
    set((state) => ({
      report,
      sessionPhase: "report",
      completedStages: state.currentStage
        ? [...state.completedStages, state.currentStage]
        : state.completedStages,
    })),

  resetSession: () => set({ ...initialState }),
}));
