import { useCarCheckStore, INSPECTION_STAGES } from "../../store/carcheck-store";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

export function InspectionOverlay() {
  const { currentStage, advanceStage } = useCarCheckStore();
  const { client, connected } = useLiveAPIContext();

  const currentIdx = INSPECTION_STAGES.indexOf(currentStage);
  const nextStage = currentIdx < INSPECTION_STAGES.length - 1
    ? INSPECTION_STAGES[currentIdx + 1]
    : null;

  const handleSkip = () => {
    if (!nextStage || !connected) return;
    advanceStage(nextStage);
    client.send({
      text: `[USER ACTION] The user skipped "${currentStage}". Move on to "${nextStage}" and tell the user where to point the camera.`,
    });
  };

  return (
    <div className="inspection-overlay">
      <div className="overlay-stage-badge">
        <span className="overlay-label">Inspecting</span>
        <span className="overlay-stage">{currentStage}</span>
      </div>
      {nextStage && (
        <button
          className="overlay-skip-btn"
          onClick={handleSkip}
          disabled={!connected}
          title={`Skip to ${nextStage}`}
        >
          Skip →
        </button>
      )}
    </div>
  );
}
