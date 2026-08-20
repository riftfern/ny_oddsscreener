import { useState } from 'react';
import { DEFAULT_NY_BOOKS } from '@ny-sharp-edge/shared';
import { usePlan } from '@/components/auth/AuthProvider';
import BookPicker from '@/components/auth/BookPicker';

export default function BookOnboarding() {
  const { setBooks } = usePlan();
  const [selected, setSelected] = useState<string[]>([...DEFAULT_NY_BOOKS]);
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
          New York is filled in. Switch state or tap shops off. We only show prices you can actually open.
        </p>
      </div>

      <BookPicker selected={selected} onChange={setSelected} />

      {error && <p className="font-mono text-[13px] text-bad">{error}</p>}

      <button
        type="button"
        disabled={selected.length === 0 || saving}
        onClick={() => void save()}
        className="btn btn-primary w-full disabled:opacity-40"
      >
        {saving ? 'Saving…' : `Show my books${selected.length ? ` (${selected.length})` : ''}`}
      </button>
    </div>
  );
}
