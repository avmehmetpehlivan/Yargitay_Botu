import { useRef, type KeyboardEvent } from 'react';
import { Badge } from '../common/Badge';

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  /** Henüz chip'e dönüşmemiş input metni (SearchView'da tutulur, böylece
   *  "Toplamaya Başla"da commit edilmemiş metin de aramaya dahil edilebilir). */
  inputValue: string;
  onInputChange: (text: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  badgeVariant?: 'brand' | 'red';
  disabled?: boolean;
}

export function KeywordInput({
  value,
  onChange,
  inputValue,
  onInputChange,
  label = 'Anahtar Kelimeler',
  hint = '(Enter ile ekle)',
  placeholder = 'Örn: işe iade, fazla mesai…',
  badgeVariant = 'brand',
  disabled,
}: KeywordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.includes(trimmed)) {
      onInputChange('');
      return;
    }
    onChange([...value, trimmed]);
    onInputChange('');
  };

  const removeKeyword = (kw: string) => {
    onChange(value.filter((k) => k !== kw));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
    if (e.key === 'Backspace' && !inputValue && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        {label}
        <span className="ml-1 text-slate-400 font-normal">{hint}</span>
      </label>

      {/* Mevcut keyword'ler */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((kw) => (
            <Badge key={kw} variant={badgeVariant} className="gap-1">
              {kw}
              {!disabled && (
                <button
                  onClick={() => removeKeyword(kw)}
                  className="ml-0.5 leading-none opacity-60 hover:opacity-100"
                  aria-label={`${kw} kaldır`}
                >
                  ×
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm
                     placeholder:text-slate-400 focus:border-brand-600 focus:outline-none
                     focus:ring-1 focus:ring-brand-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={addKeyword}
          disabled={disabled || !inputValue.trim()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
