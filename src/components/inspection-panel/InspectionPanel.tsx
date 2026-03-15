import { useCarCheckStore, INSPECTION_STAGES } from "../../store/carcheck-store";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

const SEV_LABEL: Record<string, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

export function InspectionPanel() {
  const { currentStage, completedStages, defects, advanceStage } = useCarCheckStore();
  const { client, connected } = useLiveAPIContext();

  const currentIdx = INSPECTION_STAGES.indexOf(currentStage);
  const nextStage = currentIdx < INSPECTION_STAGES.length - 1
    ? INSPECTION_STAGES[currentIdx + 1]
    : null;

  const handleSkip = () => {
    if (!nextStage || !connected) return;
    advanceStage(nextStage);
    client.send({
      text: `[USER ACTION] The user has skipped the "${currentStage}" inspection stage. Please acknowledge briefly, then move on to the "${nextStage}" stage and tell the user exactly where to point the camera.`,
    });
  };

  const totalRepairCost = defects.reduce((sum, d) => sum + d.repairCostEstimate, 0);

  return (
    <aside className="inspection-panel">
      <div className="panel-section">
        <h3 className="panel-title">Inspection Stages</h3>
        <ul className="stage-list">
          {INSPECTION_STAGES.map((stage) => {
            const isDone = completedStages.includes(stage);
            const isActive = stage === currentStage;
            return (
              <li
                key={stage}
                className={`stage-item ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
              >
                <span className="stage-icon">
                  {isDone ? "✓" : isActive ? "▶" : "○"}
                </span>
                <span className="stage-name">{stage}</span>
              </li>
            );
          })}
        </ul>
        {nextStage && (
          <button
            className="skip-btn"
            onClick={handleSkip}
            disabled={!connected}
            title={`Skip to ${nextStage}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>skip_next</span>
            Skip this section
          </button>
        )}
      </div>

      <div className="panel-section">
        <h3 className="panel-title">
          Defects Found{" "}
          <span className="defect-count">{defects.length}</span>
        </h3>
        {defects.length === 0 ? (
          <p className="no-defects">No defects detected yet</p>
        ) : (
          <ul className="defect-list">
            {defects.map((d) => (
              <li key={d.id} className={`defect-item sev-${d.severity}`}>
                <div className="defect-header">
                  <span className="defect-area">{d.area}</span>
                  <span className={`defect-badge sev-${d.severity}`}>
                    {SEV_LABEL[d.severity]}
                  </span>
                </div>
                <p className="defect-desc">{d.description}</p>
                <span className="defect-cost">
                  Est. ₹{d.repairCostEstimate.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
        {defects.length > 0 && (
          <div className="repair-total">
            Total Est. Repairs:{" "}
            <strong>₹{totalRepairCost.toLocaleString("en-IN")}</strong>
          </div>
        )}
      </div>
    </aside>
  );
}
