import { useState, useRef, useEffect } from "react";

interface Props {
  options: string[];
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function CustomSelect({ options, value, placeholder, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (open && value && listRef.current) {
      const selected = listRef.current.querySelector(".selected") as HTMLElement;
      if (selected) selected.scrollIntoView({ block: "nearest" });
    }
  }, [open, value]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div
      className={`custom-select ${disabled ? "disabled" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`custom-select-btn ${!value ? "is-placeholder" : ""} ${open ? "is-open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="custom-select-value">{value || placeholder}</span>
        <span className="custom-select-chevron">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <ul className="custom-select-list" ref={listRef}>
          {options.map((opt) => (
            <li
              key={opt}
              className={`custom-select-option ${opt === value ? "selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                handleSelect(opt);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
