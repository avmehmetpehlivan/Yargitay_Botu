import { useRef, type KeyboardEvent } from 'react';
import { clsx } from 'clsx';
import { Icon } from '../Icon';

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  inputValue: string;
  onInputChange: (text: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  badgeVariant?: 'brand' | 'red';
  disabled?: boolean;
}

/** Chip'ler ve input tek kutuda; Enter ekler, Backspace son chip'i siler, metin
 *  varken sağda "Ekle". accent (içersin) / danger (içermesin) renkli chip'ler. */
export function KeywordInput({
  value,
  onChange,
  inputValue,
  onInputChange,
  label = 'Anahtar Kelimeler',
  hint,
  placeholder = 'Örn: işe iade',
  badgeVariant = 'brand',
  disabled,
}: KeywordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const red = badgeVariant === 'red';

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.includes(trimmed)) {
      onInputChange('');
      return;
    }
    onChange([...value, trimmed]);
    onInputChange('');
  };
  const removeKeyword = (kw: string) => onChange(value.filter((k) => k !== kw));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    } else if (e.key === 'Backspace' && !inputValue && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12.5px] font-semibold text-fg">{label}</span>
        {hint && <em className="not-italic text-[11.5px] text-fg-3">{hint}</em>}
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className={clsx(
          'flex min-h-[44px] cursor-text flex-wrap items-center gap-1.5 rounded-md border border-line-2 bg-surface px-2.5 py-2 transition-colors',
          red
            ? 'focus-within:border-danger focus-within:shadow-[0_0_0_3px_var(--danger-weak)]'
            : 'focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-weak)]',
        )}
      >
        {value.map((kw) => (
          <span
            key={kw}
            className={clsx(
              'inline-flex items-center gap-1 whitespace-nowrap rounded-[7px] px-2.5 py-1 text-xs font-medium',
              red ? 'bg-danger-weak text-danger' : 'bg-accent-weak text-accent-text',
            )}
          >
            {red && '− '}
            {kw}
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeKeyword(kw);
                }}
                className="grid h-3.5 w-3.5 place-items-center rounded opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100"
                aria-label={`${kw} kaldır`}
              >
                <Icon name="x" size={11} stroke={2.2} />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[90px] flex-1 border-none bg-transparent px-0.5 py-0.5 text-[13.5px] text-fg placeholder:text-fg-faint focus:outline-none"
        />
        {inputValue.trim() && !disabled && (
          <button
            onClick={addKeyword}
            className="rounded-[7px] bg-surface-3 px-2.5 py-1 text-[11.5px] font-semibold text-fg-2 transition-colors hover:bg-accent hover:text-on-accent"
          >
            Ekle
          </button>
        )}
      </div>
    </div>
  );
}
