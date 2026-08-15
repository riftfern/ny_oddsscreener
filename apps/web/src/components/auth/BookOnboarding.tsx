import { useState } from 'react';
import { usePlan } from '@/components/auth/AuthProvider';
import BookPicker from '@/components/auth/BookPicker';

export default function BookOnboarding() {
  const { setBooks } = usePlan();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await setBooks(selected);
    } catch {
      setError('Could not save. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-ink tracking-tight text-3xl uppercase">
          Which books do you have?
        </h1>
        <p className="font-mono text-[14px] text-ink-dim mt-3">
          We only show prices at shops you can actually open. You can add more any time.
        </p>
      </div>

      <BookPicker selected={selected} onChange={setSelected} />

      {error && <p className="font-mono text-[13px] text-bad">{error}</p>}

      <button
        type="button"
        disabled={selected.length === 0 || saving}
        onClick={() => void save()}
        className="bg-moss hover:bg-moss-2 disabled:opacity-40 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-6 py-3"
      >
        {saving ? 'Saving…' : `Show my books${selected.length ? ` (${selected.length})` : ''}`}
      </button>
    </div>
  );
}
