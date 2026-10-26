import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Reusable Searchable Dropdown Component
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select Hospital / रुग्णालय निवडा',
  searchPlaceholder = 'Search by name or area / शोधा...',
  labelKey = 'label',
  valueKey = 'value',
  id = 'searchable-select',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);

  // Helper to extract option label
  const getOptLabel = (opt) => {
    if (!opt) return '';
    return opt[labelKey] ?? opt.label ?? opt.VAR_HOSPITAL_NAME ?? opt.name ?? '';
  };

  // Helper to extract option value
  const getOptValue = (opt) => {
    if (!opt) return '';
    return opt[valueKey] !== undefined
      ? opt[valueKey]
      : opt.value !== undefined
        ? opt.value
        : (opt.NUM_HOSPITAL_ID ?? opt.id ?? '');
  };

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(getOptValue(opt)) === String(value)) || null;
  }, [options, value, valueKey, labelKey]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => {
      const label = String(getOptLabel(opt) || '').toLowerCase();
      const area = String(opt.area || opt.VAR_HOSPITAL_AREA_WARD || '').toLowerCase();
      const type = String(opt.type || opt.VAR_HOSPITAL_TYPE || '').toLowerCase();
      return label.includes(term) || area.includes(term) || type.includes(term);
    });
  }, [options, searchTerm, labelKey, valueKey]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Keep highlighted index within bounds
  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
    }
  }, [filteredOptions, highlightedIndex]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && optionsListRef.current) {
      const items = optionsListRef.current.querySelectorAll('.searchable-select-option');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectOption = (opt) => {
    if (onChange) {
      onChange(getOptValue(opt), opt);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      className="searchable-select"
      ref={containerRef}
      onKeyDown={handleKeyDown}
      id={id}
    >
      {/* Control / Trigger Box */}
      <div
        className={`searchable-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-haspopup="listbox"
      >
        <span className="searchable-select-val">
          {selectedOption ? getOptLabel(selectedOption) : placeholder}
        </span>
        <svg
          className={`searchable-select-chevron ${isOpen ? 'rotated' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="searchable-select-dropdown">
          {/* Search box inside dropdown */}
          <div className="searchable-select-search">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              placeholder={searchPlaceholder}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options list */}
          <ul
            className="searchable-select-options"
            ref={optionsListRef}
            role="listbox"
          >
            {filteredOptions.map((opt, idx) => {
              const optVal = getOptValue(opt);
              const optLabel = getOptLabel(opt);
              const isSelected = String(optVal) === String(value);
              const isHighlighted = idx === highlightedIndex;
              const area = opt.area || opt.VAR_HOSPITAL_AREA_WARD;
              const type = opt.type || opt.VAR_HOSPITAL_TYPE;

              return (
                <li
                  key={optVal || idx}
                  className={`searchable-select-option ${
                    isSelected ? 'selected' : ''
                  } ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="searchable-select-opt-title">
                    {optLabel}
                  </div>
                  {(area || type) && (
                    <div className="searchable-select-opt-meta">
                      {area && <span>{area}</span>}
                      {area && type && <span> • </span>}
                      {type && <span>{type}</span>}
                    </div>
                  )}
                </li>
              );
            })}

            {filteredOptions.length === 0 && (
              <li className="searchable-select-empty">
                No hospitals found matching "{searchTerm}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
