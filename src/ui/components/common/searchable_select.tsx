import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  keywords?: string[];
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchThreshold?: number; // Threshold to auto show search (default: 8)
  searchable?: boolean; // Explicitly force search on or off
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string | boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dropdownClassName?: string;
  emptyText?: string;
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm...',
  searchThreshold = 8,
  searchable,
  clearable = false,
  disabled = false,
  required = false,
  error,
  size = 'md',
  className = '',
  dropdownClassName = '',
  emptyText = 'Không tìm thấy kết quả phù hợp',
  renderOption,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if search input should be visible
  const isSearchVisible = typeof searchable === 'boolean' 
    ? searchable 
    : options.length > searchThreshold;

  // Selected option object
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(query) : false;
      const matchValue = opt.value.toLowerCase().includes(query);
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(query) : false;
      const matchKeywords = opt.keywords ? opt.keywords.some((k) => k.toLowerCase().includes(query)) : false;
      return matchLabel || matchSublabel || matchValue || matchBadge || matchKeywords;
    });
  }, [options, searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      if (isSearchVisible) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
      }
    }
  }, [isOpen, isSearchVisible]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          scrollIntoView(next);
          return next;
        });
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            handleSelect(option.value);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option-item]');
    const target = items[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg min-h-[32px]',
    md: 'px-3 py-2 text-xs rounded-lg min-h-[38px]',
    lg: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative w-full text-left font-sans select-none ${className}`}
    >
      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 border bg-white transition-all text-left outline-none ${
          sizeClasses[size]
        } ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : error
            ? 'border-red-300 ring-2 ring-red-100 hover:border-red-400'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-100 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="text-slate-500 shrink-0">{selectedOption.icon}</span>
          )}

          {selectedOption ? (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-slate-400 text-[11px] truncate shrink-0">
                  {selectedOption.sublabel}
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                    selectedOption.badgeColor || 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 ml-1 text-slate-400">
          {clearable && value && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={13} />
            </div>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          />
        </div>
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in ${dropdownClassName}`}
          style={{ minWidth: '100%' }}
        >
          {/* Search Header when items > searchThreshold */}
          {isSearchVisible && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50 space-y-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <Search size={20} className="text-slate-300 stroke-1 mb-1.5" />
                <p className="text-xs font-medium text-slate-500">{emptyText}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Thử tìm kiếm với từ khóa khác</p>
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = highlightedIndex === index;

                if (renderOption) {
                  return (
                    <div
                      key={opt.value}
                      data-option-item
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      className="cursor-pointer"
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <button
                    key={opt.value}
                    data-option-item
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="text-slate-400 shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`truncate ${isSelected ? 'text-blue-700 font-bold' : ''}`}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                opt.badgeColor || (isSelected ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600')
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Optional Footer: Count info */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>{filteredOptions.length} kết quả</span>
              {isSearchVisible && <span className="italic">Gõ để tìm kiếm</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
