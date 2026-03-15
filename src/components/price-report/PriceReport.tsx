import { useCarCheckStore } from "../../store/carcheck-store";

const SEV_LABEL: Record<string, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

export function PriceReport() {
  const { carInfo, defects, report, resetSession } = useCarCheckStore();

  if (!report || !carInfo) return null;

  const savings = carInfo.askingPrice - report.fairPrice;

  return (
    <div className="price-report-overlay">
      <div className="price-report-card">
        <div className="report-header">
          <h1>Inspection Report</h1>
          <p className="report-car">
            {carInfo.year} {carInfo.make} {carInfo.model} · {carInfo.mileage.toLocaleString()} miles
          </p>
        </div>

        {/* Price summary */}
        <div className="price-summary">
          <div className="price-box asking">
            <span className="price-label">Asking Price</span>
            <span className="price-value">${carInfo.askingPrice.toLocaleString()}</span>
          </div>
          <div className="price-arrow">→</div>
          <div className="price-box fair">
            <span className="price-label">Fair Offer</span>
            <span className="price-value fair-value">${report.fairPrice.toLocaleString()}</span>
          </div>
          <div className="price-box savings">
            <span className="price-label">You Save</span>
            <span className="price-value savings-value">${savings.toLocaleString()}</span>
          </div>
        </div>

        {/* Price breakdown */}
        {report.breakdown.length > 0 && (
          <div className="report-section">
            <h3>Price Breakdown</h3>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Adjustment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Asking Price</td>
                  <td className="amount-positive">${carInfo.askingPrice.toLocaleString()}</td>
                </tr>
                {report.breakdown.map((item, i) => (
                  <tr key={i}>
                    <td>{item.label}</td>
                    <td className={item.amount < 0 ? "amount-negative" : "amount-positive"}>
                      {item.amount < 0 ? "-" : "+"}${Math.abs(item.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Fair Offer Price</td>
                  <td className="fair-total">${report.fairPrice.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Defects */}
        {defects.length > 0 && (
          <div className="report-section">
            <h3>Defects Found ({defects.length})</h3>
            <table className="defects-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {defects.map((d) => (
                  <tr key={d.id}>
                    <td>{d.area}</td>
                    <td>{d.description}</td>
                    <td>
                      <span className={`badge sev-${d.severity}`}>
                        {SEV_LABEL[d.severity]}
                      </span>
                    </td>
                    <td>${d.repairCostEstimate.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bargaining points */}
        {report.bargainingPoints.length > 0 && (
          <div className="report-section">
            <h3>Bargaining Points</h3>
            <ul className="bargaining-list">
              {report.bargainingPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="reset-btn" onClick={resetSession}>
          Start New Inspection
        </button>
      </div>
    </div>
  );
}
