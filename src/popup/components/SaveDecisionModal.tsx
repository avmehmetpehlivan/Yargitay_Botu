import { useState } from 'react';
import { clsx } from 'clsx';
import type { Decision } from '../../shared/types/Decision';
import { useCollectionsStore } from '../store/collections.store';
import { useToastStore } from '../store/toast.store';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { CategoryEditor } from './CategoryEditor';
import { Icon } from './Icon';

interface Props {
  decisions: Decision[]; // 1 = çoklu kategori toggle; >1 = toplu ekleme
  keywords: string[];
  onClose: () => void;
}

export function SaveDecisionModal({ decisions, keywords, onClose }: Props) {
  const { categories, saved, createCategory, toggleDecisionCategory, addDecisionsToCategory, unsaveDecision } =
    useCollectionsStore();
  const pushToast = useToastStore((s) => s.push);
  const [showNew, setShowNew] = useState(categories.length === 0);

  const single = decisions.length === 1 ? decisions[0] : null;
  const current = single ? saved.find((d) => d.id === single.id) : null;
  const memberOf = (categoryId: string) => !!current?.categoryIds.includes(categoryId);

  // Tek karar: üyeliği aç/kapat (modal açık kalır). Toplu: ekle + kapat.
  const onPickCategory = async (categoryId: string) => {
    if (single) {
      await toggleDecisionCategory(single, keywords, categoryId);
    } else {
      await addDecisionsToCategory(decisions, keywords, categoryId);
      pushToast(`${decisions.length} karar koleksiyona eklendi`);
      onClose();
    }
  };

  const createAndPick = async (name: string, color: string) => {
    const cat = await createCategory(name, color);
    setShowNew(false);
    await onPickCategory(cat.id);
  };

  const removeAll = async () => {
    if (single) await unsaveDecision(single.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--scrim)] p-4" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-xl border border-line-2 bg-surface p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-sm font-semibold text-fg">
            {single ? 'Kategoriler' : `${decisions.length} karar için kategori seç`}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-fg-3">
            {single
              ? `${single.chamber} · ${single.esasNo} · ${formatDateTR(single.date)}`
              : 'Seçili kararlar bir kategoriye eklenir.'}
          </p>
          {single && <p className="mt-0.5 text-[11px] text-fg-3">Birden fazla kategori seçebilirsiniz.</p>}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-col gap-1">
            {categories.map((c) => {
              const member = memberOf(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => onPickCategory(c.id)}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                    member ? 'border-accent bg-accent-weak' : 'border-line hover:bg-surface-2',
                  )}
                >
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="min-w-0 flex-1 truncate text-fg">{c.name}</span>
                  {single &&
                    (member ? (
                      <Icon name="check" size={15} stroke={2.4} className="shrink-0 text-accent-text" />
                    ) : (
                      <Icon name="plus" size={15} className="shrink-0 text-fg-faint" />
                    ))}
                </button>
              );
            })}
          </div>
        )}

        {showNew ? (
          <CategoryEditor
            submitLabel="Oluştur ve ekle"
            onSubmit={createAndPick}
            onCancel={categories.length ? () => setShowNew(false) : undefined}
          />
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <Icon name="plus" size={14} /> Yeni kategori
          </button>
        )}

        <div className="flex gap-2 border-t border-line pt-2">
          {single && current && (
            <button
              onClick={removeAll}
              className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-weak"
            >
              Tümünden kaldır
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-fg-2 transition-colors hover:bg-surface-3"
          >
            {single ? 'Bitti' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  );
}
