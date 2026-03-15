import { useState } from "react";
import { CarInfo, useCarCheckStore } from "../../store/carcheck-store";
import { INDIAN_CARS, MAKES } from "../../data/indian-cars";

export function CarInfoForm() {
  const { setCarInfo, setSessionPhase } = useCarCheckStore();

  const [makeChoice, setMakeChoice] = useState("");   // dropdown value
  const [modelChoice, setModelChoice] = useState(""); // dropdown value
  const [makeText, setMakeText] = useState("");        // typed when Others
  const [modelText, setModelText] = useState("");      // typed when Others
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [askingPrice, setAskingPrice] = useState("");

  const isOtherMake = makeChoice === "Others";
  const isOtherModel = modelChoice === "Others";

  // Effective values submitted
  const effectiveMake = isOtherMake ? makeText.trim() : makeChoice;
  const effectiveModel = isOtherModel ? modelText.trim() : modelChoice;

  const models = makeChoice && !isOtherMake ? INDIAN_CARS[makeChoice] ?? [] : [];

  const handleMakeChange = (val: string) => {
    setMakeChoice(val);
    setModelChoice("");
    setMakeText("");
    setModelText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveMake || !effectiveModel || !year || !mileage || !askingPrice) return;

    const info: CarInfo = {
      make: effectiveMake,
      model: effectiveModel,
      year: parseInt(year),
      mileage: parseInt(mileage),
      askingPrice: parseFloat(askingPrice),
    };
    setCarInfo(info);
    setSessionPhase("inspecting");
  };

  return (
    <div className="car-info-overlay">
      <div className="car-info-card">
        <div className="car-info-header">
          <span className="car-info-icon">🚗</span>
          <h1>CarCheck</h1>
          <p>AI-powered used car inspection assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="car-info-form">
          {/* Make */}
          <div className="form-group">
            <label>Make</label>
            <select
              value={makeChoice}
              onChange={(e) => handleMakeChange(e.target.value)}
              required
            >
              <option value="" disabled>Select make…</option>
              {MAKES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value="Others">Others</option>
            </select>
            {isOtherMake && (
              <input
                type="text"
                className="other-input"
                placeholder="Type make name"
                value={makeText}
                onChange={(e) => setMakeText(e.target.value)}
                required
                autoFocus
              />
            )}
          </div>

          {/* Model — only show once make is chosen */}
          {makeChoice && (
            <div className="form-group">
              <label>Model</label>
              {isOtherMake ? (
                <input
                  type="text"
                  placeholder="Type model name"
                  value={modelText}
                  onChange={(e) => setModelText(e.target.value)}
                  required
                />
              ) : (
                <>
                  <select
                    value={modelChoice}
                    onChange={(e) => {
                      setModelChoice(e.target.value);
                      setModelText("");
                    }}
                    required
                  >
                    <option value="" disabled>Select model…</option>
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {isOtherModel && (
                    <input
                      type="text"
                      className="other-input"
                      placeholder="Type model name"
                      value={modelText}
                      onChange={(e) => setModelText(e.target.value)}
                      required
                      autoFocus
                    />
                  )}
                </>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                placeholder="e.g. 2020"
                min="1980"
                max="2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Odometer</label>
              <div className="input-adornment">
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  min="0"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  required
                />
                <span className="adornment-suffix">km</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Asking Price</label>
            <div className="input-adornment">
              <span className="adornment-prefix">₹</span>
              <input
                type="number"
                placeholder="e.g. 500000"
                min="0"
                step="1000"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="start-btn">
            Start Inspection →
          </button>
        </form>

        <p className="car-info-hint">
          After submitting, click the <strong>play button</strong> to connect AI and begin.
        </p>
      </div>
    </div>
  );
}
