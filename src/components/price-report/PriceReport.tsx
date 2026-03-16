import { useCarCheckStore } from "../../store/carcheck-store";
import { CarInfo, Defect, Report } from "../../store/carcheck-store";

const SEV_LABEL: Record<string, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

const SEV_COLOR: Record<string, string> = {
  minor: "#22c55e",
  moderate: "#f59e0b",
  major: "#ef4444",
};

function buildHtmlReport(carInfo: CarInfo, defects: Defect[], report: Report): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const savings = carInfo.askingPrice - report.fairPrice;
  const totalRepairs = defects.reduce((s, d) => s + d.repairCostEstimate, 0);

  const defectRows = defects.map(d => `
    <tr>
      <td>${d.area}</td>
      <td>${d.description}</td>
      <td style="color:${SEV_COLOR[d.severity]};font-weight:600">${SEV_LABEL[d.severity]}</td>
      <td style="text-align:right">₹${d.repairCostEstimate.toLocaleString("en-IN")}</td>
    </tr>`).join("");

  const breakdownRows = report.breakdown.map(item => `
    <tr>
      <td>${item.label}</td>
      <td style="text-align:right;color:${item.amount < 0 ? "#ef4444" : "#22c55e"}">
        ${item.amount < 0 ? "−" : "+"}₹${Math.abs(item.amount).toLocaleString("en-IN")}
      </td>
    </tr>`).join("");

  const bargainingPoints = report.bargainingPoints.map((pt, i) => `
    <li style="margin-bottom:8px"><strong>${i + 1}.</strong> ${pt}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CarCheck Report — ${carInfo.year} ${carInfo.make} ${carInfo.model}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; font-size: 14px; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; }
    h1 { font-size: 26px; color: #1e293b; }
    h2 { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
    .header-left h1 { color: #3b82f6; }
    .header-left .car-name { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .header-left .meta { color: #64748b; margin-top: 4px; font-size: 13px; }
    .header-right { text-align: right; color: #64748b; font-size: 13px; }
    .price-row { display: flex; gap: 16px; margin-bottom: 32px; }
    .price-box { flex: 1; border-radius: 10px; padding: 16px 20px; text-align: center; }
    .price-box .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .price-box .value { font-size: 22px; font-weight: 800; }
    .asking { background: #f1f5f9; }
    .asking .value { color: #475569; }
    .fair { background: #eff6ff; border: 2px solid #3b82f6; }
    .fair .label { color: #3b82f6; }
    .fair .value { color: #1d4ed8; }
    .savings { background: #f0fdf4; border: 2px solid #22c55e; }
    .savings .label { color: #16a34a; }
    .savings .value { color: #15803d; }
    .section { margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; text-align: left; padding: 8px 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid #e2e8f0; }
    ul { list-style: none; padding: 0; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 28px; }
    .summary-item { background: #f8fafc; border-radius: 8px; padding: 10px 14px; }
    .summary-item .slabel { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
    .summary-item .svalue { font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 2px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print { body { background: #fff; } .page { padding: 20px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>CarCheck</h1>
      <div class="car-name">${carInfo.year} ${carInfo.make} ${carInfo.model}</div>
      <div class="meta">Odometer: ${carInfo.mileage.toLocaleString("en-IN")} km &nbsp;·&nbsp; Inspection Date: ${date}</div>
    </div>
    <div class="header-right">
      <div><strong>AI Inspection Report</strong></div>
      <div style="margin-top:4px">Powered by Google Gemini</div>
    </div>
  </div>

  <div class="price-row">
    <div class="price-box asking">
      <div class="label">Asking Price</div>
      <div class="value">₹${carInfo.askingPrice.toLocaleString("en-IN")}</div>
    </div>
    <div class="price-box fair">
      <div class="label">Fair Offer Price</div>
      <div class="value">₹${report.fairPrice.toLocaleString("en-IN")}</div>
    </div>
    <div class="price-box savings">
      <div class="label">Potential Savings</div>
      <div class="value">₹${savings.toLocaleString("en-IN")}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-item">
      <div class="slabel">Total Defects Found</div>
      <div class="svalue">${defects.length}</div>
    </div>
    <div class="summary-item">
      <div class="slabel">Estimated Repair Cost</div>
      <div class="svalue">₹${totalRepairs.toLocaleString("en-IN")}</div>
    </div>
    <div class="summary-item">
      <div class="slabel">Major Issues</div>
      <div class="svalue" style="color:${defects.filter(d => d.severity === "major").length > 0 ? "#ef4444" : "#22c55e"}">${defects.filter(d => d.severity === "major").length}</div>
    </div>
    <div class="summary-item">
      <div class="slabel">Moderate Issues</div>
      <div class="svalue" style="color:${defects.filter(d => d.severity === "moderate").length > 0 ? "#f59e0b" : "#22c55e"}">${defects.filter(d => d.severity === "moderate").length}</div>
    </div>
  </div>

  ${report.breakdown.length > 0 ? `
  <div class="section">
    <h2>Price Breakdown</h2>
    <table>
      <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Asking Price</td><td style="text-align:right">₹${carInfo.askingPrice.toLocaleString("en-IN")}</td></tr>
        ${breakdownRows}
        <tr class="total-row"><td>Fair Offer Price</td><td style="text-align:right;color:#1d4ed8">₹${report.fairPrice.toLocaleString("en-IN")}</td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${defects.length > 0 ? `
  <div class="section">
    <h2>Defects Found (${defects.length})</h2>
    <table>
      <thead><tr><th>Area</th><th>Description</th><th>Severity</th><th style="text-align:right">Est. Cost</th></tr></thead>
      <tbody>${defectRows}
        <tr class="total-row">
          <td colspan="3">Total Estimated Repairs</td>
          <td style="text-align:right">₹${totalRepairs.toLocaleString("en-IN")}</td>
        </tr>
      </tbody>
    </table>
  </div>` : `<div class="section"><h2>Defects Found</h2><p style="color:#64748b;padding:12px 0">No defects detected during inspection.</p></div>`}

  ${report.bargainingPoints.length > 0 ? `
  <div class="section">
    <h2>Bargaining Points — Use These When Negotiating</h2>
    <ul style="padding:8px 0">${bargainingPoints}</ul>
  </div>` : ""}

  <div class="footer">
    This report was generated by CarCheck AI. It is based on a visual and interactive inspection and should be used as a guide only.<br>
    For a legally binding assessment, consult a certified mechanic.
  </div>
</div>
</body>
</html>`;
}

function downloadReport(carInfo: CarInfo, defects: Defect[], report: Report) {
  const html = buildHtmlReport(carInfo, defects, report);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CarCheck_${carInfo.year}_${carInfo.make}_${carInfo.model}_Report.html`.replace(/\s+/g, "_");
  a.click();
  URL.revokeObjectURL(url);
}

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
            {carInfo.year} {carInfo.make} {carInfo.model} · {carInfo.mileage.toLocaleString("en-IN")} km
          </p>
        </div>

        {/* Price summary */}
        <div className="price-summary">
          <div className="price-box asking">
            <span className="price-label">Asking Price</span>
            <span className="price-value">₹{carInfo.askingPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="price-arrow">→</div>
          <div className="price-box fair">
            <span className="price-label">Fair Offer</span>
            <span className="price-value fair-value">₹{report.fairPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="price-box savings">
            <span className="price-label">You Save</span>
            <span className="price-value savings-value">₹{savings.toLocaleString("en-IN")}</span>
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
                  <td className="amount-positive">₹{carInfo.askingPrice.toLocaleString("en-IN")}</td>
                </tr>
                {report.breakdown.map((item, i) => (
                  <tr key={i}>
                    <td>{item.label}</td>
                    <td className={item.amount < 0 ? "amount-negative" : "amount-positive"}>
                      {item.amount < 0 ? "-" : "+"}₹{Math.abs(item.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Fair Offer Price</td>
                  <td className="fair-total">₹{report.fairPrice.toLocaleString("en-IN")}</td>
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
                    <td>₹{d.repairCostEstimate.toLocaleString("en-IN")}</td>
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

        <div className="report-actions">
          <button
            className="download-btn"
            onClick={() => downloadReport(carInfo, defects, report)}
          >
            <span className="material-symbols-outlined">download</span>
            Download Report
          </button>
          <button className="reset-btn" onClick={resetSession}>
            Start New Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
