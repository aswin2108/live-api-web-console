import { useEffect } from "react";
import { FunctionDeclaration, Type } from "@google/genai";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { useCarCheckStore } from "../store/carcheck-store";

export const recordDefectDeclaration: FunctionDeclaration = {
  name: "record_defect",
  description:
    "Record a defect or issue found during the car inspection. Call this IMMEDIATELY for every defect you visually detect.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      area: {
        type: Type.STRING,
        description:
          "The area of the car where the defect was found (e.g. 'Front bumper', 'Driver door', 'Engine bay')",
      },
      description: {
        type: Type.STRING,
        description: "Clear description of the defect observed",
      },
      severity: {
        type: Type.STRING,
        enum: ["minor", "moderate", "major"],
        description:
          "minor = cosmetic / under $500 | moderate = $500-$2000 | major = over $2000 / structural / safety",
      },
      estimated_repair_cost_usd: {
        type: Type.NUMBER,
        description: "Estimated repair cost in USD",
      },
    },
    required: ["area", "description", "severity", "estimated_repair_cost_usd"],
  },
};

export const advanceStageDeclaration: FunctionDeclaration = {
  name: "advance_stage",
  description:
    "Move to the next inspection stage when you are satisfied with the current area.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      next_stage: {
        type: Type.STRING,
        description:
          "The name of the next inspection stage to move to (e.g. 'Exterior Left')",
      },
      instruction_for_user: {
        type: Type.STRING,
        description:
          "Clear camera instruction for the user (e.g. 'Please move to the left side of the car and show me the door and fender')",
      },
    },
    required: ["next_stage", "instruction_for_user"],
  },
};

export const completeInspectionDeclaration: FunctionDeclaration = {
  name: "complete_inspection",
  description:
    "Call this after all 7 inspection stages are complete to generate the final price report.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fair_price_usd: {
        type: Type.NUMBER,
        description:
          "The calculated fair offer price (asking price minus repair costs minus 5-10% negotiation buffer)",
      },
      price_breakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            amount: { type: Type.NUMBER },
          },
          required: ["label", "amount"],
        },
        description:
          "Itemized price deductions (e.g. [{label: 'Paint scratch repair', amount: -300}])",
      },
      bargaining_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "3-5 specific talking points the buyer can use when negotiating",
      },
    },
    required: ["fair_price_usd", "price_breakdown", "bargaining_points"],
  },
};

export const allCarCheckDeclarations = [
  recordDefectDeclaration,
  advanceStageDeclaration,
  completeInspectionDeclaration,
];

export function useCarCheckTools() {
  const { client } = useLiveAPIContext();
  const { recordDefect, advanceStage, completeInspection } = useCarCheckStore();

  useEffect(() => {
    const handleToolCall = (toolCall: any) => {
      const responses: any[] = [];

      for (const fc of toolCall.functionCalls || []) {
        const args = fc.args || {};

        if (fc.name === "record_defect") {
          recordDefect({
            area: args.area,
            description: args.description,
            severity: args.severity,
            repairCostEstimate: args.estimated_repair_cost_usd,
          });
          responses.push({ id: fc.id, response: { output: "Defect recorded." } });
        } else if (fc.name === "advance_stage") {
          advanceStage(args.next_stage);
          responses.push({
            id: fc.id,
            response: { output: `Advanced to stage: ${args.next_stage}` },
          });
        } else if (fc.name === "complete_inspection") {
          completeInspection({
            fairPrice: args.fair_price_usd,
            breakdown: args.price_breakdown || [],
            bargainingPoints: args.bargaining_points || [],
          });
          responses.push({
            id: fc.id,
            response: { output: "Inspection complete. Report generated." },
          });
        } else {
          responses.push({
            id: fc.id,
            response: { output: "Unknown function." },
          });
        }
      }

      client.sendToolResponse({ functionResponses: responses });
    };

    client.on("toolcall", handleToolCall);
    return () => {
      client.off("toolcall", handleToolCall);
    };
  }, [client, recordDefect, advanceStage, completeInspection]);
}
