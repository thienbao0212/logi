import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (newValues: string[]) => void;
  singleSelect?: boolean;
}

export default function FilterDropdown({
  label,
  options,
  selectedValues,
  onChange,
  singleSelect = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSelection = selectedValues.length > 0;
  
  let displayValue = '';
  if (selectedValues.length > 0) {
    const firstSelected = options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0];
    if (selectedValues.length === 1) {
      displayValue = firstSelected;
    } else {
      displayValue = `${firstSelected} +${selectedValues.length - 1}`;
    }
  }

  const toggleOption = (val: string) => {
    if (singleSelect) {
      onChange(selectedValues.includes(val) ? [] : [val]);
      setIsOpen(false);
      return;
    }
    
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
          hasSelection
            ? 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-[0_1px_2px_rgba(37,99,235,0.05)]'
            : isOpen 
              ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
        }`}
      >
        <span className={hasSelection ? 'font-semibold' : ''}>{label}</span>
        {hasSelection && (
          <>
            <span className="text-blue-300 font-normal">=</span>
            <span className="text-blue-700 max-w-[120px] truncate font-semibold">{displayValue}</span>
          </>
        )}
        <div className="flex items-center ml-0.5">
          {hasSelection ? (
            <div
              onClick={clearSelection}
              className="p-0.5 rounded-full hover:bg-blue-200 text-blue-400 hover:text-blue-700 transition-colors ml-1"
            >
              <X size={13} strokeWidth={2.5} />
            </div>
          ) : (
            <ChevronDown size={14} className={isOpen ? 'text-slate-600' : 'text-slate-400'} strokeWidth={2.5} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-60 rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-left">
          <div className="py-1.5 max-h-72 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    {singleSelect ? (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    )}
                    {option.icon && <span className="text-slate-400">{option.icon}</span>}
                    <span className={`truncate ${isSelected ? 'font-medium text-slate-900' : ''}`}>{option.label}</span>
                  </div>
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500 italic">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
