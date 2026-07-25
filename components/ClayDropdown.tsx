"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type ClayDropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function ClayDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
}: ClayDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full clay-input p-4 rounded-xl text-sm flex items-center justify-between cursor-pointer text-left font-semibold text-slate-800"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 clay-card rounded-2xl shadow-clay overflow-hidden max-h-60 overflow-y-auto bg-white/95 backdrop-blur-md border border-white/40">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-sm transition-colors font-medium ${
                  opt.value === value
                    ? "bg-primary/20 text-primary font-bold"
                    : "text-slate-700 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
