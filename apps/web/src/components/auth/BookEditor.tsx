import { useState } from 'react';
import { getVenue } from '@ny-sharp-edge/shared';
import { usePlan } from '@/components/auth/AuthProvider';
import BookPicker from '@/components/auth/BookPicker';

export default function BookEditor({ onClose }: { onClose?: () => void }) {
  const { books, setBooks } = usePlan();
  const [selected, setSelected] = useState<string[]>(books ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (selected.length === 0) {
      setError('Pick at least one book.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setBooks(selected);
      onClose?.();
    } catch {
      setError('Could not save. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-ink text-xl">Your books</h2>
          <p className="font-mono text-[13px] text-ink-dim mt-1">
            Tap to add or remove. The board only shows these.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink"
          >
            Close
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <p className="font-mono text-[12px] text-ink-dim">
          {selected.map((id) => getVenue(id).shortName).join(' · ')}
        </p>
      )}

      <BookPicker selected={selected} onChange={setSelected} />

      {error && <p className="font-mono text-[13px] text-bad">{error}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-6 py-3"
      >
        {saving ? 'Saving…' : 'Save books'}
      </button>
    </div>
  );
}
