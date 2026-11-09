import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2 } from 'lucide-react';

export interface AnimalSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  debounceMs?: number;
  initialValue?: string;
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const AnimalSearch: React.FC<AnimalSearchProps> = ({
  onSearch,
  placeholder,
  debounceMs = 350,
  initialValue = '',
  isLoading = false,
  className = '',
  autoFocus = false,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const isFirstRender = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state if initialValue changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounced search trigger
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch(value.trim());
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  const resolvedPlaceholder = placeholder || t('animals.searchByNameOrId', {
    defaultValue: 'Buscar por nombre o número de identificación...'
  });

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full ${className}`}
    >
      {/* Search / Loading Icon */}
      <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
        {isLoading ? (
          <Loader2 className="animate-spin text-emerald-600" size={18} />
        ) : (
          <Search size={18} className="text-gray-400" />
        )}
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-20 py-2.5 text-sm bg-white border border-gray-200 rounded-xl shadow-2xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition text-gray-800 placeholder-gray-400"
      />

      {/* Action buttons (Clear and Search) */}
      <div className="absolute right-2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            aria-label={t('animals.clearSearch', { defaultValue: 'Limpiar búsqueda' })}
            title={t('animals.clearSearch', { defaultValue: 'Limpiar búsqueda' })}
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          className="btn px-2.5 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
        >
          <span>{t('animals.searchButton', { defaultValue: 'Buscar' })}</span>
        </button>
      </div>
    </form>
  );
};

export default AnimalSearch;
