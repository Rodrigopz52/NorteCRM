import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function CustomMultiSelect({ value = [], onChange, options, className, placeholder = "Seleccionar..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      const opt = options.find(o => o.value === value[0]);
      return opt ? opt.label : placeholder;
    }
    return `${value.length} seleccionados`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-200 bg-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 shadow-sm cursor-pointer"
      >
        <span className="truncate pr-2 text-left">{getDisplayText()}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-lg py-1 animate-fadeIn max-h-60 flex flex-col">
          <div className="overflow-auto">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                    isSelected ? "bg-purple-50 text-purple-900 font-medium" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? "bg-purple-500 text-white" : "border border-gray-300"}`}>
                      {isSelected && <CheckIcon className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {value.length > 0 && (
            <div className="p-1 border-t border-gray-100 mt-1">
              <button
                onClick={() => onChange([])}
                className="w-full text-center px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              >
                Borrar filtro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
