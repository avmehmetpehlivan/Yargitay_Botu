import { useEffect, useMemo, useState } from 'react';
import type { Decision } from '../../shared/types/Decision';
import type { SavedDecision } from '../../shared/types/Collection';
import { useCollectionsStore } from '../store/collections.store';
import { usePreview } from '../hooks/usePreview';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { useToastStore } from '../store/toast.store';
import { formatDateTR } from '../../shared/utils/dateUtils';
import { ReadingPane } from '../components/ReadingPane';
import { CategoryEditor } from '../components/CategoryEditor';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

const LIB = 'mx-auto w-full max-w-[920px] px-[clamp(20px,5vw,56px)] pb-20 pt-[26px]';

function toDecision(s: SavedDecision): Decision {
  return { ...s, title: '', fullText: '', scrapedAt: s.savedAt };
}

export function CollectionsView() {
  const {
    categories,
    saved,
    isLoaded,
    load,
    createCategory,
    updateCategory,
    deleteCategory,
    removeFromCategory,
  } = useCollectionsStore();
  const preview = usePreview();
  const { download } = usePdfDownload();
  const pushToast = useToastStore((s) => s.push);

  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoaded) void load();
  }, [isLoaded, load]);

  const byCategory = useMemo(() => {
    const map = new Map<string, SavedDecision[]>();
    for (const c of categories) map.set(c.id, []);
    for (const d of saved) for (const cid of d.categoryIds) map.get(cid)?.push(d);
    for (const list of map.values()) list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    return map;
  }, [categories, saved]);

  const previewDecision = preview.previewId
    ? (saved.find((d) => d.id === preview.previewId) ?? null)
    : null;

  const toggle = (id: string) =>
    setCollapsed((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className={LIB}>
      <div className="mb-[22px] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-fg">Koleksiyonlar</h2>
          <p className="mt-[5px] max-w-[460px] text-[12.5px] leading-relaxed text-fg-3">
            Kaydettiğiniz kararları kategoriler altında toplayın.
          </p>
        </div>
        {!showNew && (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line-2 bg-surface px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <Icon name="folderPlus" size={15} /> Yeni koleksiyon
          </button>
        )}
      </div>

      {showNew && (
        <div className="mb-3">
          <CategoryEditor
            submitLabel="Oluştur"
            onSubmit={(name, color) => {
              void createCategory(name, color);
              setShowNew(false);
            }}
            onCancel={() => setShowNew(false)}
          />
        </div>
      )}

      {categories.length === 0 && !showNew ? (
        <EmptyState
          icon="bookmark"
          title="Henüz koleksiyon yok"
          body="Arama sonuçlarından veya karar detayından bir kararı kaydederek kategori oluşturabilirsin."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((c) => {
            const list = byCategory.get(c.id) ?? [];
            const open = !collapsed.has(c.id);
            return (
              <div key={c.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                {editingId === c.id ? (
                  <div className="p-2.5">
                    <CategoryEditor
                      initialName={c.name}
                      initialColor={c.color}
                      submitLabel="Kaydet"
                      onSubmit={(name, color) => {
                        void updateCategory(c.id, { name, color });
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-3">
                    <button
                      onClick={() => toggle(c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <Icon
                        name="chevronDown"
                        size={14}
                        className="text-fg-3"
                        style={{
                          transform: open ? 'none' : 'rotate(-90deg)',
                          transition: 'transform .2s',
                        }}
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="truncate text-sm font-semibold tracking-[-0.01em] text-fg">
                        {c.name}
                      </span>
                      <span className="rounded-full border border-line bg-surface-2 px-2 py-px text-[11.5px] tabular-nums text-fg-3">
                        {list.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setEditingId(c.id)}
                      title="Yeniden adlandır"
                      className="grid h-7 w-7 place-items-center rounded-md text-fg-3 transition-colors hover:bg-surface-3 hover:text-fg"
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `"${c.name}" kategorisi ve içindeki ${list.length} karar silinecek. Devam edilsin mi?`,
                          )
                        )
                          void deleteCategory(c.id);
                      }}
                      title="Sil"
                      className="grid h-7 w-7 place-items-center rounded-md text-fg-3 transition-colors hover:bg-danger-weak hover:text-danger"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                )}

                {open && editingId !== c.id && (
                  <div className="border-t border-line">
                    {list.length === 0 && (
                      <p className="p-4 text-center text-xs text-fg-3">Bu kategoride karar yok.</p>
                    )}
                    {list.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => preview.open(d.id)}
                        className="group flex cursor-pointer items-center gap-2.5 border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold tracking-[-0.01em] text-fg">
                            {d.chamber}
                          </div>
                          <div className="mt-[3px] font-mono text-[11.5px] text-fg-3">
                            {d.esasNo} · {d.kararNo} · {formatDateTR(d.date)}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-px opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              preview.open(d.id);
                            }}
                            title="Önizle"
                            className="grid h-7 w-7 place-items-center rounded-md text-fg-3 hover:bg-surface-3 hover:text-accent-text"
                          >
                            <Icon name="eye" size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void removeFromCategory(d.id, c.id);
                            }}
                            title="Bu kategoriden çıkar"
                            className="grid h-7 w-7 place-items-center rounded-md text-fg-3 hover:bg-danger-weak hover:text-danger"
                          >
                            <Icon name="x" size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewDecision && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--scrim)] p-[5vh]"
          onClick={preview.close}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-line-2 bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <ReadingPane
              decision={toDecision(previewDecision)}
              terms={previewDecision.keywords}
              state={preview.state}
              text={preview.text}
              saved
              savedColor={categories.find((c) => c.id === previewDecision.categoryIds[0])?.color}
              backMode={false}
              onClose={preview.close}
              onCopy={() =>
                preview.text &&
                void navigator.clipboard
                  .writeText(preview.text)
                  .then(() => pushToast('Karar metni panoya kopyalandı'))
                  .catch(() => {})
              }
              onPdf={() =>
                preview.text &&
                void download(
                  [{ ...toDecision(previewDecision), fullText: preview.text }],
                  previewDecision.keywords,
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
