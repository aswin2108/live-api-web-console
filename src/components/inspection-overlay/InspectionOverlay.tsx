import { useCarCheckStore } from "../../store/carcheck-store";

export function InspectionOverlay() {
  const { currentStage } = useCarCheckStore();

  return (
    <div className="inspection-overlay">
      <div className="overlay-stage-badge">
        <span className="overlay-label">Inspecting</span>
        <span className="overlay-stage">{currentStage}</span>
      </div>
    </div>
  );
}
