import { KURULLAR, HUKUK_DAIRELERI, CEZA_DAIRELERI } from '../../shared/constants/yargitayUnits';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { CheckboxDropdown } from './CheckboxDropdown';
import type { DetailFields } from '../../shared/types/SearchCriteria';

interface Props {
  value: DetailFields;
  onChange: (v: DetailFields) => void;
  disabled?: boolean;
}

const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-fg-2';
const inputCls =
  'w-full rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none disabled:opacity-50';

export function DetailedSearch({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<DetailFields>) => onChange({ ...value, ...patch });

  const hasAny = Object.values(value).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));

  // DD.MM.YYYY <-> YYYY-MM-DD (HTML date input) dönüşümleri
  const toIso = (s?: string) => {
    if (!s) return '';
    const [d, m, y] = s.split('.');
    return y ? `${y}-${m}-${d}` : '';
  };
  const fromIso = (iso: string) => (iso ? formatDateTR(iso) : undefined);

  return (
    <div className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface-2 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] text-fg-3">Birim seçilmezse tüm birimlerde aranır.</p>
        <button
          type="button"
          disabled={disabled || !hasAny}
          onClick={() => onChange({})}
          className="text-[11px] font-medium text-fg-3 hover:text-danger disabled:opacity-40"
        >
          Filtreleri temizle
        </button>
      </div>

      <CheckboxDropdown
        label="Kurullar"
        options={[...KURULLAR]}
        value={value.kurullar ?? []}
        disabled={disabled}
        onChange={(v) => set({ kurullar: v })}
      />
      <CheckboxDropdown
        label="Hukuk Daireleri"
        options={HUKUK_DAIRELERI}
        value={value.hukukDaireleri ?? []}
        disabled={disabled}
        onChange={(v) => set({ hukukDaireleri: v })}
      />
      <CheckboxDropdown
        label="Ceza Daireleri"
        options={CEZA_DAIRELERI}
        value={value.cezaDaireleri ?? []}
        disabled={disabled}
        onChange={(v) => set({ cezaDaireleri: v })}
      />

      {/* Esas No */}
      <div>
        <span className={labelCls}>Esas No (yıl / ilk – son)</span>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <input className={inputCls} placeholder="Yıl" value={value.esasYil ?? ''} disabled={disabled}
            onChange={(e) => set({ esasYil: e.target.value })} />
          <input className={inputCls} placeholder="İlk sıra" value={value.esasIlkSiraNo ?? ''} disabled={disabled}
            onChange={(e) => set({ esasIlkSiraNo: e.target.value })} />
          <input className={inputCls} placeholder="Son sıra" value={value.esasSonSiraNo ?? ''} disabled={disabled}
            onChange={(e) => set({ esasSonSiraNo: e.target.value })} />
        </div>
      </div>

      {/* Karar No */}
      <div>
        <span className={labelCls}>Karar No (yıl / ilk – son)</span>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <input className={inputCls} placeholder="Yıl" value={value.kararYil ?? ''} disabled={disabled}
            onChange={(e) => set({ kararYil: e.target.value })} />
          <input className={inputCls} placeholder="İlk sıra" value={value.kararIlkSiraNo ?? ''} disabled={disabled}
            onChange={(e) => set({ kararIlkSiraNo: e.target.value })} />
          <input className={inputCls} placeholder="Son sıra" value={value.kararSonSiraNo ?? ''} disabled={disabled}
            onChange={(e) => set({ kararSonSiraNo: e.target.value })} />
        </div>
      </div>

      {/* Karar Tarihi */}
      <div>
        <span className={labelCls}>Karar Tarihi (başlangıç – bitiş)</span>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <input type="date" className={inputCls} value={toIso(value.baslangicTarihi)} disabled={disabled}
            onChange={(e) => set({ baslangicTarihi: fromIso(e.target.value) })} />
          <input type="date" className={inputCls} value={toIso(value.bitisTarihi)} disabled={disabled}
            onChange={(e) => set({ bitisTarihi: fromIso(e.target.value) })} />
        </div>
      </div>

      {/* Sıralama */}
      <div className="grid grid-cols-2 gap-1">
        <div>
          <span className={labelCls}>Sıralama</span>
          <select className={`${inputCls} mt-1`} value={value.siralama ?? '1'} disabled={disabled}
            onChange={(e) => set({ siralama: e.target.value as DetailFields['siralama'] })}>
            <option value="1">Esas No</option>
            <option value="2">Karar No</option>
            <option value="3">Karar Tarihi</option>
          </select>
        </div>
        <div>
          <span className={labelCls}>Yön</span>
          <select className={`${inputCls} mt-1`} value={value.siralamaDirection ?? 'desc'} disabled={disabled}
            onChange={(e) => set({ siralamaDirection: e.target.value as DetailFields['siralamaDirection'] })}>
            <option value="desc">Büyükten Küçüğe</option>
            <option value="asc">Küçükten Büyüğe</option>
          </select>
        </div>
      </div>
    </div>
  );
}
