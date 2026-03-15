import { useState } from "react";
import { CarInfo, useCarCheckStore } from "../../store/carcheck-store";

export function CarInfoForm() {
  const { setCarInfo, setSessionPhase } = useCarCheckStore();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    askingPrice: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.year || !form.mileage || !form.askingPrice) return;

    const info: CarInfo = {
      make: form.make.trim(),
      model: form.model.trim(),
      year: parseInt(form.year),
      mileage: parseInt(form.mileage),
      askingPrice: parseFloat(form.askingPrice),
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
          <div className="form-row">
            <div className="form-group">
              <label>Make</label>
              <input
                type="text"
                placeholder="e.g. Toyota"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                placeholder="e.g. Camry"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                placeholder="e.g. 2019"
                min="1980"
                max="2026"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Mileage</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                min="0"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Asking Price ($)</label>
            <input
              type="number"
              placeholder="e.g. 18500"
              min="0"
              step="100"
              value={form.askingPrice}
              onChange={(e) => setForm({ ...form, askingPrice: e.target.value })}
              required
            />
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
